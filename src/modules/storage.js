const fs = require('fs');
const path = require('path');
const { getDataDir, ensureDirectoryExists } = require('./logger');
const logger = require('./logger');

class DataStorage {
  constructor(dataDir = null) {
    if (dataDir) {
      this.dataDir = path.isAbsolute(dataDir) ? dataDir : path.resolve(process.cwd(), dataDir);
    } else {
      this.dataDir = getDataDir();
    }
    ensureDirectoryExists(this.dataDir);
    logger.info(`Storage initialized: ${this.dataDir}`);
  }

  saveDataset(name, data, format = 'json') {
    const filePath = path.join(this.dataDir, `${name}.${format}`);
    const tempPath = path.join(this.dataDir, `${name}.${format}.tmp`);

    try {
      logger.info(`Saving dataset: ${name}`, { format, filePath });

      const content = format === 'json' ? JSON.stringify(data, null, 2) : data;
      fs.writeFileSync(tempPath, content);
      fs.renameSync(tempPath, filePath);

      const recordCount = format === 'json' ? (Array.isArray(data) ? data.length : 1) : 0;

      logger.info(`Dataset saved: ${name}`, { size: content.length, recordCount });

      return { success: true, filePath, size: content.length, recordCount };
    } catch (error) {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      logger.error(`Failed to save dataset: ${name}`, { error: error.message });
      throw error;
    }
  }

  loadDataset(name, format = 'json') {
    const filePath = path.join(this.dataDir, `${name}.${format}`);

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
