const logger = require('./logger');

const DATA_SCHEMAS = {
  buildings: { type: 'array' },
  materials: { type: 'array' },
  planets: { type: 'array' },
  recipes: { type: 'array' },
  ship_alldesigns: { type: 'array' },
  ship_allships: { type: 'array' },
  systemstars_allsectors: { type: 'array' },
  systemstars_allstars: { type: 'array' },
  exchange_all: { type: 'array' },
  exchange_full: { type: 'array' },
  chat_list: { type: 'array' },
  csv_buildings: { type: 'string' },
  csv_buildingcosts: { type: 'string' },
  csv_buildingworkforces: { type: 'string' },
  csv_buildingrecipes: { type: 'string' },
  csv_materials: { type: 'string' },
  csv_prices: { type: 'string' },
  csv_prices_condensed: { type: 'string' },
  csv_orders: { type: 'string' },
  csv_bids: { type: 'string' },
  csv_recipeinputs: { type: 'string' },
  csv_recipeoutputs: { type: 'string' },
  csv_planets: { type: 'string' },
  csv_planetresources: { type: 'string' },
  csv_planetproductionfees: { type: 'string' },
  csv_planetdetail: { type: 'string' },
  csv_systems: { type: 'string' },
  csv_systemlinks: { type: 'string' },
  csv_systemplanets: { type: 'string' },
  csv_infrastructure_allreports: { type: 'string' },
  csv_infrastructure_allinfos: { type: 'string' },
  csv_burnrate: { type: 'string' },
  csv_sites: { type: 'string' },
  csv_workforce: { type: 'string' },
  csv_cxos: { type: 'string' }
};

class DataValidator {
  constructor() {
    this.schemas = DATA_SCHEMAS;
    this.validationErrors = [];
  }

  validate(data, schemaName) {
    this.validationErrors = [];
    const schema = this.schemas[schemaName];

    if (!schema) {
      logger.warn(`No schema found for ${schemaName}, skipping validation`);
      return { valid: true, warnings: ['No schema defined'], recordCount: Array.isArray(data) ? data.length : 1 };
    }

    if (schema.type === 'array') {
      return this.validateArray(data, schema, schemaName);
    } else if (schema.type === 'string') {
      return this.validateString(data, schemaName);
    }

    return { valid: true, recordCount: 1 };
  }

  validateArray(data, schema, schemaName) {
    if (!Array.isArray(data)) {
      this.validationErrors.push({
        field: schemaName,
        error: `Expected array but got ${typeof data}`,
        severity: 'error'
      });
      return { valid: false, errors: this.validationErrors, recordCount: 0 };
    }

    const result = {
      valid: true,
      recordCount: data.length,
      errors: this.validationErrors
    };

    logger.info(`Validation completed for ${schemaName}`, {
      recordCount: data.length,
      valid: result.valid
    });

    return result;
  }

  validateString(data, schemaName) {
    if (typeof data !== 'string') {
      this.validationErrors.push({
        field: schemaName,
        error: `Expected string but got ${typeof data}`,
        severity: 'error'
      });
      return { valid: false, errors: this.validationErrors };
    }

    return { valid: true, dataSize: data.length };
  }

  validateAll(datasets) {
    const results = {};
    let allValid = true;

    for (const [name, data] of Object.entries(datasets)) {
      const result = this.validate(data, name);
      results[name] = result;
      if (!result.valid) {
        allValid = false;
      }
    }

    logger.info('Bulk validation completed', { allValid, datasetCount: Object.keys(results).length });

    return { allValid, results };
  }
}

module.exports = { DataValidator, DATA_SCHEMAS };
