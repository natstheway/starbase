/**
 * Bitsight Integration for JupiterOne/Starbase
 *
 * This integration collects security ratings, risk vectors, assets,
 * and findings from Bitsight for External Attack Surface Management (EASM).
 */

import {
  IntegrationInvocationConfig,
  IntegrationInstanceConfigFieldMap,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from './types';
import { createBitsightClient } from './client';
import {
  fetchAccountStep,
  fetchCompaniesStep,
  fetchRiskVectorsStep,
  fetchAssetsStep,
  fetchFindingsStep,
} from './steps';

/**
 * Instance configuration fields
 * These are mapped from environment variables in UPPERCASE format
 */
export const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  apiKey: {
    type: 'string',
    mask: true,
  },
  companyGuid: {
    type: 'string',
    mask: false,
  },
  includeSubsidiaries: {
    type: 'boolean',
    mask: false,
  },
  includeFindingsHistory: {
    type: 'boolean',
    mask: false,
  },
};

/**
 * Validate the integration configuration
 */
async function validateInvocation(
  context: { instance: { config: IntegrationConfig } }
): Promise<void> {
  const { config } = context.instance;

  if (!config.apiKey) {
    throw new IntegrationValidationError(
      'Configuration requires an API key. Please set BITSIGHT_API_KEY in your environment.'
    );
  }

  // Verify authentication by making a test API call
  const client = createBitsightClient({ apiKey: config.apiKey });

  try {
    await client.verifyAuthentication();
  } catch (error) {
    throw new IntegrationValidationError(
      `Failed to authenticate with Bitsight API: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Integration invocation configuration
 */
export const invocationConfig: IntegrationInvocationConfig<IntegrationConfig> = {
  instanceConfigFields,
  validateInvocation,
  integrationSteps: [
    fetchAccountStep,
    fetchCompaniesStep,
    fetchRiskVectorsStep,
    fetchAssetsStep,
    fetchFindingsStep,
  ],
};

// Export types for external use
export * from './types';
export * from './client';
export * from './converters';
