const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getDataDir, ensureDirectoryExists } = require('./logger');
const logger = require('./logger');

function computeHash(content) {
  return crypto.createHash('md5').update(content, 'utf8').digest('hex');
}

class DataStorage {
  constructor(dataDir = null) {
    if (dataDir) {
      this.dataDir = path.isAbsolute(dataDir) ? dataDir : path.resolve(process.cwd(), dataDir);
    } else {
      this.dataDir = getDataDir();
    }
    this.hashDir = path.join(this.dataDir, '.hashes');
    ensureDirectoryExists(this.dataDir);
    ensureDirectoryExists(this.hashDir);
    logger.info(`Storage initialized: ${this.dataDir}`);
  }

  getHashPath(name, format) {
    return path.join(this.hashDir, `${name}.${format}.md5`);
  }

  getStoredHash(name, format) {
    const hashPath = this.getHashPath(name, format);
    if (!fs.existsSync(hashPath)) {
      return null;
    }
    return fs.readFileSync(hashPath, 'utf8').trim();
  }

  saveHash(name, format, hash) {
    const hashPath = this.getHashPath(name, format);
    fs.writeFileSync(hashPath, hash);
  }

  saveDataset(name, data, format = 'json', skipIfUnchanged = true) {
    let fileName = name;
    if (name.endsWith(`.${format}`)) {
      fileName = name;
    } else {
      fileName = `${name}.${format}`;
    }
    const filePath = path.join(this.dataDir, fileName);
    const tempPath = path.join(this.dataDir, `${name}.${format}.tmp`);

    try {
      const content = format === 'json' ? JSON.stringify(data, null, 2) : data;
      const newHash = computeHash(content);

      if (skipIfUnchanged) {
        const existingHash = this.getStoredHash(name, format);
        if (existingHash === newHash) {
          logger.info(`Dataset unchanged, skipping: ${name}`);
          return { success: true, skipped: true, filePath, hash: newHash };
        }
      }

      logger.info(`Saving dataset: ${name}`, { format, filePath });

      fs.writeFileSync(tempPath, content);
      fs.renameSync(tempPath, filePath);
      this.saveHash(name, format, newHash);

      const recordCount = format === 'json' ? (Array.isArray(data) ? data.length : 1) : 0;

      logger.info(`Dataset saved: ${name}`, { size: content.length, recordCount });

      return { success: true, skipped: false, filePath, size: content.length, recordCount, hash: newHash };
    } catch (error) {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      logger.error(`Failed to save dataset: ${name}`, { error: error.message });
      throw error;
    }
  }

  loadDataset(name, format = 'json') {
    let fileName = name;
    if (!name.endsWith(`.${format}`)) {
      fileName = `${name}.${format}`;
    }
    const filePath = path.join(this.dataDir, fileName);

    try {
      if (!fs.existsSync(filePath)) {
        logger.warn(`Dataset not found: ${name}`);
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const data = format === 'json' ? JSON.parse(content) : content;

      logger.info(`Dataset loaded: ${name}`, { size: content.length });

      return data;
    } catch (error) {
      logger.error(`Failed to load dataset: ${name}`, { error: error.message });
      throw error;
    }
  }

  getStorageStats() {
    const stats = {
      totalDatasets: 0,
      datasets: {},
      lastUpdated: null,
      totalSize: 0
    };

    if (!fs.existsSync(this.dataDir)) {
      return stats;
    }

    const files = fs.readdirSync(this.dataDir);

    for (const file of files) {
      if (file === '.gitkeep') continue;

      const filePath = path.join(this.dataDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        const name = path.basename(file, path.extname(file));
        stats.datasets[name] = {
          size: stat.size,
          timestamp: stat.mtime.toISOString()
        };
        stats.totalSize += stat.size;
        stats.totalDatasets++;

        if (!stats.lastUpdated || stat.mtime > new Date(stats.lastUpdated)) {
          stats.lastUpdated = stat.mtime.toISOString();
        }
      }
    }

    logger.info('Storage stats computed', stats);

    return stats;
  }

  listStoredDatasets() {
    if (!fs.existsSync(this.dataDir)) {
      return [];
    }

    return fs.readdirSync(this.dataDir)
      .filter(file => file !== '.gitkeep' && !file.endsWith('.tmp'))
      .map(file => path.basename(file, path.extname(file)));
  }
}

module.exports = { DataStorage };
