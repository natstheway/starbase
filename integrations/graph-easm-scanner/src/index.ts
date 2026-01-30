/**
 * Generic EASM Scanner Integration for JupiterOne/Starbase
 *
 * A flexible integration for importing external attack surface data from
 * custom scanners. Supports JSON files, CSV files, and custom APIs.
 *
 * Use this integration to import data from:
 * - Custom internal security scanners
 * - Third-party EASM tools without native integrations
 * - Manual security assessments
 * - Penetration testing results
 * - Bug bounty findings
 */

import {
  IntegrationInvocationConfig,
  IntegrationInstanceConfigFieldMap,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from './types';
import { createEASMScannerClient } from './client';
import { integrationSteps } from './steps';

export const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  scannerName: {
    type: 'string',
    mask: false,
  },
  dataSourceType: {
    type: 'string',
    mask: false,
  },
  dataFilePath: {
    type: 'string',
    mask: false,
  },
  apiUrl: {
    type: 'string',
    mask: false,
  },
  apiKey: {
    type: 'string',
    mask: true,
  },
  apiAuthHeader: {
    type: 'string',
    mask: false,
  },
};

async function validateInvocation(
  context: { instance: { config: IntegrationConfig } }
): Promise<void> {
  const { config } = context.instance;

  if (!config.scannerName) {
    throw new IntegrationValidationError(
      'Configuration requires a scanner name. Please set EASM_SCANNER_NAME in your environment.'
    );
  }

  if (!config.dataSourceType) {
    throw new IntegrationValidationError(
      'Configuration requires a data source type (file or api). Please set EASM_SCANNER_DATA_SOURCE_TYPE in your environment.'
    );
  }

  if (config.dataSourceType !== 'file' && config.dataSourceType !== 'api') {
    throw new IntegrationValidationError(
      'Data source type must be either "file" or "api".'
    );
  }

  if (config.dataSourceType === 'file' && !config.dataFilePath) {
    throw new IntegrationValidationError(
      'File-based data source requires a data file path. Please set EASM_SCANNER_DATA_FILE_PATH in your environment.'
    );
  }

  if (config.dataSourceType === 'api' && !config.apiUrl) {
    throw new IntegrationValidationError(
      'API-based data source requires an API URL. Please set EASM_SCANNER_API_URL in your environment.'
    );
  }

  const client = createEASMScannerClient({
    scannerName: config.scannerName,
    dataSourceType: config.dataSourceType,
    dataFilePath: config.dataFilePath,
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    apiAuthHeader: config.apiAuthHeader,
  });

  try {
    const isAccessible = await client.verifyDataSource();
    if (!isAccessible) {
      throw new IntegrationValidationError(
        'Data source is not accessible. Please verify your configuration.'
      );
    }
  } catch (error) {
    if (error instanceof IntegrationValidationError) {
      throw error;
    }
    throw new IntegrationValidationError(
      `Failed to verify data source: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export const invocationConfig: IntegrationInvocationConfig<IntegrationConfig> = {
  instanceConfigFields,
  validateInvocation,
  integrationSteps,
};

export * from './types';
export * from './client';
export * from './converters';
