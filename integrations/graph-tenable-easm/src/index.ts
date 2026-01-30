/**
 * Tenable EASM Integration for JupiterOne/Starbase
 *
 * This integration collects external attack surface data from
 * Tenable Attack Surface Management (formerly Tenable.asm / Bit Discovery).
 */

import {
  IntegrationInvocationConfig,
  IntegrationInstanceConfigFieldMap,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from './types';
import { createTenableEASMClient } from './client';
import { integrationSteps } from './steps';

export const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  accessKey: {
    type: 'string',
    mask: true,
  },
  secretKey: {
    type: 'string',
    mask: true,
  },
  region: {
    type: 'string',
    mask: false,
  },
  inventoryId: {
    type: 'string',
    mask: false,
  },
  includeTechnologies: {
    type: 'boolean',
    mask: false,
  },
  includeWebApps: {
    type: 'boolean',
    mask: false,
  },
};

async function validateInvocation(
  context: { instance: { config: IntegrationConfig } }
): Promise<void> {
  const { config } = context.instance;

  if (!config.accessKey) {
    throw new IntegrationValidationError(
      'Configuration requires an access key. Please set TENABLE_EASM_ACCESS_KEY in your environment.'
    );
  }

  if (!config.secretKey) {
    throw new IntegrationValidationError(
      'Configuration requires a secret key. Please set TENABLE_EASM_SECRET_KEY in your environment.'
    );
  }

  const client = createTenableEASMClient({
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    region: config.region,
  });

  try {
    await client.verifyAuthentication();
  } catch (error) {
    throw new IntegrationValidationError(
      `Failed to authenticate with Tenable EASM API: ${error instanceof Error ? error.message : 'Unknown error'}`
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
