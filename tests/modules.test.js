const { DataValidator, DATA_SCHEMAS } = require('../src/modules/validator');
const { DataStorage } = require('../src/modules/storage');
const { FioApiClient, ApiError, PUBLIC_ENDPOINTS, CSV_ENDPOINTS } = require('../src/modules/apiClient');

describe('DataValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new DataValidator();
  });

  describe('validate', () => {
    test('should validate array with required fields', () => {
      const data = [
        { Ticker: 'ABC', Name: 'Test Building' },
        { Ticker: 'DEF', Name: 'Another Building' }
      ];

      const result = validator.validate(data, 'buildings');

      expect(result.valid).toBe(true);
      expect(result.recordCount).toBe(2);
    });

    test('should validate array without checking field presence', () => {
      const data = [
        { Ticker: 'ABC' }
      ];

      const result = validator.validate(data, 'buildings');

      expect(result.valid).toBe(true);
      expect(result.recordCount).toBe(1);
    });

    test('should validate object with any fields', () => {
      const data = { CurrentTime: '2026-03-27T10:00:00Z' };

      const result = validator.validate(data, 'global_current');

      expect(result.valid).toBe(true);
    });

    test('should validate any type for global_current', () => {
      const data = 'not an object';

      const result = validator.validate(data, 'global_current');

      expect(result.valid).toBe(true);
    });

    test('should validate CSV string data', () => {
      const data = 'col1,col2\nval1,val2';

      const result = validator.validate(data, 'csv_buildings');

      expect(result.valid).toBe(true);
    });

    test('should handle unknown schema with warning', () => {
      const data = { some: 'data' };

      const result = validator.validate(data, 'unknown_schema');

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('No schema defined');
    });
  });

  describe('validateAll', () => {
    test('should validate multiple datasets', () => {
      const datasets = {
        buildings: [
          { Ticker: 'ABC', Name: 'Test' }
        ],
        materials: [
          { Ticker: 'MAT1', Name: 'Material 1' }
        ]
      };

      const result = validator.validateAll(datasets);

      expect(result.allValid).toBe(true);
      expect(result.results.buildings.valid).toBe(true);
      expect(result.results.materials.valid).toBe(true);
    });
  });
});

describe('DataStorage', () => {
  let storage;
  const testDir = './test-data';

  beforeEach(() => {
    storage = new DataStorage(testDir);
  });

  afterAll(() => {
    const fs = require('fs');
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('saveDataset and loadDataset', () => {
    test('should save and load JSON dataset', () => {
      const data = { name: 'test', items: [1, 2, 3] };

      storage.saveDataset('test_json', data, 'json');
      const loaded = storage.loadDataset('test_json', 'json');

      expect(loaded).toEqual(data);
    });

    test('should save and load CSV dataset', () => {
      const data = 'col1,col2\nval1,val2';

      storage.saveDataset('test_csv', data, 'csv');
      const loaded = storage.loadDataset('test_csv', 'csv');

      expect(loaded).toBe(data);
    });

    test('should return null for non-existent dataset', () => {
      const result = storage.loadDataset('non_existent');

      expect(result).toBeNull();
    });
  });

  describe('getStorageStats', () => {
    test('should return storage statistics', () => {
      const data = { name: 'stats_test' };
      storage.saveDataset('stats_test', data, 'json');

      const stats = storage.getStorageStats();

      expect(stats.totalDatasets).toBeGreaterThan(0);
      expect(stats.datasets).toHaveProperty('stats_test');
      expect(stats.totalSize).toBeGreaterThan(0);
    });
  });

  describe('listStoredDatasets', () => {
    test('should list stored datasets', () => {
      const data = { name: 'list_test' };
      storage.saveDataset('list_test', data, 'json');

      const list = storage.listStoredDatasets();

      expect(list).toContain('list_test');
    });
  });
});

describe('FioApiClient', () => {
  describe('endpoint definitions', () => {
    test('PUBLIC_ENDPOINTS should be defined', () => {
      expect(PUBLIC_ENDPOINTS).toBeDefined();
      expect(Array.isArray(PUBLIC_ENDPOINTS)).toBe(true);
      expect(PUBLIC_ENDPOINTS.length).toBeGreaterThan(0);
    });

    test('CSV_ENDPOINTS should be defined', () => {
      expect(CSV_ENDPOINTS).toBeDefined();
      expect(Array.isArray(CSV_ENDPOINTS)).toBe(true);
      expect(CSV_ENDPOINTS.length).toBeGreaterThan(0);
    });

    test('each endpoint should have required properties', () => {
      const allEndpoints = [...PUBLIC_ENDPOINTS, ...CSV_ENDPOINTS];

      allEndpoints.forEach(endpoint => {
        expect(endpoint).toHaveProperty('name');
        expect(endpoint).toHaveProperty('path');
        expect(endpoint).toHaveProperty('type');
        expect(typeof endpoint.name).toBe('string');
        expect(typeof endpoint.path).toBe('string');
        expect(['json', 'csv']).toContain(endpoint.type);
      });
    });
  });

  describe('ApiError', () => {
    test('should create error with message and status code', () => {
      const error = new ApiError('Test error', 404);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('ApiError');
    });
  });
});
