/**
 * Step: Fetch Account
 * Creates the Bitsight account entity
 */

import {
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig, BITSIGHT_ACCOUNT, EntityClasses } from '../types';
import { createAccountEntity } from '../converters';

export const STEP_FETCH_ACCOUNT = 'fetch-account';

export const fetchAccountStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_ACCOUNT,
  name: 'Fetch Account',
  entities: [
    {
      resourceName: 'Account',
      _type: BITSIGHT_ACCOUNT,
      _class: EntityClasses.ACCOUNT,
    },
  ],
  relationships: [],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance } = context;
    const { config } = instance;

    const accountEntity = createAccountEntity(config.apiKey);
    await jobState.addEntity(accountEntity);
  },
};
