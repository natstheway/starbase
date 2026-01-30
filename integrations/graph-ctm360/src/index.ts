/**
 * CTM360 Integration for JupiterOne/Starbase
 *
 * This integration collects external attack surface data, threat intelligence,
 * data leaks, and brand abuse incidents from CTM360.
 */

import {
  IntegrationInvocationConfig,
  IntegrationInstanceConfigFieldMap,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from './types';
import { createCTM360Client } from './client';
import {
  fetchAccountStep,
  fetchOrganizationStep,
  fetchDomainsStep,
  fetchVulnerabilitiesStep,
  fetchThreatsStep,
} from './steps';

export const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  apiKey: {
    type: 'string',
    mask: true,
  },
  apiUrl: {
    type: 'string',
    mask: false,
  },
  tenantId: {
    type: 'string',
    mask: false,
  },
  includeThreats: {
    type: 'boolean',
    mask: false,
  },
  includeDataLeaks: {
    type: 'boolean',
    mask: false,
  },
  includeBrandAbuse: {
    type: 'boolean',
    mask: false,
  },
};

async function validateInvocation(
  context: { instance: { config: IntegrationConfig } }
): Promise<void> {
  const { config } = context.instance;

  if (!config.apiKey) {
    throw new IntegrationValidationError(
      'Configuration requires an API key. Please set CTM360_API_KEY in your environment.'
    );
  }

  const client = createCTM360Client({
    apiKey: config.apiKey,
    apiUrl: config.apiUrl,
    tenantId: config.tenantId,
  });

  try {
    await client.verifyAuthentication();
  } catch (error) {
    throw new IntegrationValidationError(
      `Failed to authenticate with CTM360 API: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export const invocationConfig: IntegrationInvocationConfig<IntegrationConfig> = {
  instanceConfigFields,
  validateInvocation,
  integrationSteps: [
    fetchAccountStep,
    fetchOrganizationStep,
    fetchDomainsStep,
    fetchVulnerabilitiesStep,
    fetchThreatsStep,
  ],
};

export * from './types';
export * from './client';
export * from './converters';
