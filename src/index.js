const { FioApiClient, PUBLIC_ENDPOINTS, CSV_ENDPOINTS } = require('./modules/apiClient');
const { DataValidator } = require('./modules/validator');
const { DataStorage } = require('./modules/storage');
const { analyzeOwnership } = require('./analyzeOwnership');
const logger = require('./modules/logger');

const GITHUB_ACTIONS = process.env.GITHUB_ACTIONS === 'true';

class FioDataFetcher {
  constructor(options = {}) {
    this.apiClient = new FioApiClient();
    this.validator = new DataValidator();
    this.storage = new DataStorage(options.dataDir);
    this.stats = {
      startTime: null,
      endTime: null,
      totalFetched: 0,
      totalSaved: 0,
      totalFailed: 0,
      datasets: {}
    };
  }

  async initialize() {
    this.stats.startTime = new Date().toISOString();
    logger.info('FIO Data Fetcher initialized', {
      timestamp: this.stats.startTime,
      githubActions: GITHUB_ACTIONS,
      nodeVersion: process.version,
      workingDir: process.cwd()
    });
  }

  async fetchAndStore(endpoint) {
    const { name, path, type } = endpoint;
    const format = type === 'csv' ? 'csv' : 'json';

    try {
      logger.info(`Processing endpoint: ${name}`);

      const rawData = await this.apiClient.fetchEndpoint(endpoint);

      if (!rawData) {
        throw new Error('Empty response from API');
      }

      const validation = this.validator.validate(rawData, name);

      if (!validation.valid) {
        logger.warn(`Validation issues for ${name}`, { errors: validation.errors });
      }

      const result = this.storage.saveDataset(name, rawData, format);

      this.stats.datasets[name] = {
        status: 'success',
        timestamp: new Date().toISOString(),
        recordCount: validation.recordCount || result.recordCount || 0,
        size: result.size
      };

      this.stats.totalSaved++;
      this.stats.totalFetched++;

      logger.info(`Successfully processed ${name}`, {
        recordCount: validation.recordCount,
        size: result.size
      });

      return { name, status: 'saved', validation };

    } catch (error) {
      logger.error(`Failed to process ${name}`, { error: error.message });

      this.stats.datasets[name] = {
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error.message
      };

      this.stats.totalFailed++;

      return { name, status: 'failed', error: error.message };
    }
  }

  async fetchAllPublicData() {
    logger.info('Starting public data fetch cycle');

    const results = { success: [], failed: [] };

    for (const endpoint of PUBLIC_ENDPOINTS) {
      const result = await this.fetchAndStore(endpoint);

      if (result.status === 'saved') {
        results.success.push(result.name);
      } else {
        results.failed.push({ name: result.name, error: result.error });
      }
    }

    logger.info('Public data fetch cycle completed', {
      success: results.success.length,
      failed: results.failed.length
    });

    return results;
  }

  async fetchAllCsvData() {
    logger.info('Starting CSV data fetch cycle');

    const results = { success: [], failed: [] };

    for (const endpoint of CSV_ENDPOINTS) {
      const result = await this.fetchAndStore(endpoint);

      if (result.status === 'saved') {
        results.success.push(result.name);
      } else {
        results.failed.push({ name: result.name, error: result.error });
      }
    }

    logger.info('CSV data fetch cycle completed', {
      success: results.success.length,
      failed: results.failed.length
    });

    return results;
  }

  async run() {
    try {
      await this.initialize();

      const publicResults = await this.fetchAllPublicData();
      const csvResults = await this.fetchAllCsvData();

      logger.info('Running ownership analysis...');
      analyzeOwnership();

      this.stats.endTime = new Date().toISOString();

      const finalStats = {
        ...this.stats,
        publicEndpoints: publicResults,
        csvEndpoints: csvResults,
        duration: new Date(this.stats.endTime) - new Date(this.stats.startTime)
      };

      logger.info('FIO Data Fetcher run completed', {
        totalFetched: finalStats.totalFetched,
        totalSaved: finalStats.totalSaved,
        totalFailed: finalStats.totalFailed,
        duration: finalStats.duration
      });

      return finalStats;

    } catch (error) {
      logger.error('FIO Data Fetcher run failed', { error: error.message });
      this.stats.endTime = new Date().toISOString();
      throw error;
    }
  }
}

if (require.main === module) {
  const dataDir = process.env.DATA_DIR || null;
  const fetcher = new FioDataFetcher({ dataDir });

  fetcher.run()
    .then(stats => {
      console.log('\n=== Fetch Summary ===');
      console.log(`Total fetched: ${stats.totalFetched}`);
      console.log(`Total saved: ${stats.totalSaved}`);
      console.log(`Total failed: ${stats.totalFailed}`);
      console.log(`Duration: ${stats.duration}ms`);

      if (stats.publicEndpoints.failed.length > 0) {
        console.log('\nFailed public endpoints:');
        stats.publicEndpoints.failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
      }

      if (stats.csvEndpoints.failed.length > 0) {
        console.log('\nFailed CSV endpoints:');
        stats.csvEndpoints.failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
      }

      if (GITHUB_ACTIONS) {
        console.log(`::set-output name=total_fetched::${stats.totalFetched}`);
        console.log(`::set-output name=total_saved::${stats.totalSaved}`);
        console.log(`::set-output name=total_failed::${stats.totalFailed}`);
      }

      process.exit(stats.totalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { FioDataFetcher };
