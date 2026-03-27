const axios = require('axios');
const logger = require('./logger');

const BASE_URL = 'https://rest.fnar.net';

const PUBLIC_ENDPOINTS = [
  { name: 'buildings', path: '/building/allbuildings', type: 'json' },
  { name: 'materials', path: '/material/allmaterials', type: 'json' },
  { name: 'planets', path: '/planet/allplanets', type: 'json' },
  { name: 'systemstars_allstars', path: '/systemstars/allstars', type: 'json' },
  { name: 'exchange_all', path: '/exchange/all', type: 'json' },
  { name: 'exchange_full', path: '/exchange/full', type: 'json' },
  { name: 'chat_list', path: '/chat/list', type: 'json' }
];

const CSV_ENDPOINTS = [
  { name: 'csv_buildings', path: '/csv/buildings', type: 'csv' },
  { name: 'csv_buildingcosts', path: '/csv/buildingcosts', type: 'csv' },
  { name: 'csv_buildingworkforces', path: '/csv/buildingworkforces', type: 'csv' },
  { name: 'csv_buildingrecipes', path: '/csv/buildingrecipes', type: 'csv' },
  { name: 'csv_materials', path: '/csv/materials', type: 'csv' },
  { name: 'csv_prices', path: '/csv/prices', type: 'csv' },
  { name: 'csv_prices_condensed', path: '/csv/prices/condensed', type: 'csv' },
  { name: 'csv_orders', path: '/csv/orders', type: 'csv' },
  { name: 'csv_bids', path: '/csv/bids', type: 'csv' },
  { name: 'csv_recipeinputs', path: '/csv/recipeinputs', type: 'csv' },
  { name: 'csv_recipeoutputs', path: '/csv/recipeoutputs', type: 'csv' },
  { name: 'csv_planets', path: '/csv/planets', type: 'csv' },
  { name: 'csv_planetresources', path: '/csv/planetresources', type: 'csv' },
  { name: 'csv_planetproductionfees', path: '/csv/planetproductionfees', type: 'csv' },
  { name: 'csv_planetdetail', path: '/csv/planetdetail', type: 'csv' },
  { name: 'csv_systems', path: '/csv/systems', type: 'csv' },
  { name: 'csv_systemlinks', path: '/csv/systemlinks', type: 'csv' },
  { name: 'csv_systemplanets', path: '/csv/systemplanets', type: 'csv' },
  { name: 'csv_infrastructure_allreports', path: '/csv/infrastructure/allreports', type: 'csv' },
  { name: 'csv_infrastructure_allinfos', path: '/csv/infrastructure/allinfos', type: 'csv' }
];

class FioApiClient {
  constructor() {
    this.baseUrl = BASE_URL;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async fetchEndpoint(endpoint, retryCount = 3) {
    const url = endpoint.path;
    let lastError;

    for (let i = 0; i < retryCount; i++) {
      try {
        logger.info(`Fetching endpoint: ${endpoint.name}`, { path: url, attempt: i + 1 });
        const response = await this.client.get(url);
        logger.info(`Successfully fetched: ${endpoint.name}`, {
          path: url,
          status: response.status,
          dataSize: response.data ? JSON.stringify(response.data).length : 0
        });
        return response.data;
      } catch (error) {
        lastError = error;
        logger.warn(`Attempt ${i + 1} failed for ${endpoint.name}`, { error: error.message });

        if (error.response?.status === 401) {
          throw new ApiError('Authentication required', 401);
        }

        if (i < retryCount - 1) {
          await this.delay(1000 * (i + 1));
        }
      }
    }

    logger.error(`All attempts failed for endpoint: ${endpoint.name}`, { error: lastError.message });
    throw new ApiError(`Failed to fetch ${endpoint.name}: ${lastError.message}`, lastError.response?.status);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

module.exports = { FioApiClient, ApiError, PUBLIC_ENDPOINTS, CSV_ENDPOINTS };
