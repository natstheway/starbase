/**
 * Step: Fetch Organization
 * Fetches organization details from CTM360
 */

import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  createDirectRelationship,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import {
  IntegrationConfig,
  CTM360_ACCOUNT,
  CTM360_ORGANIZATION,
  EntityClasses,
  Relationships,
} from '../types';
import { createOrganizationEntity } from '../converters';
import { createCTM360Client } from '../client';
import { STEP_FETCH_ACCOUNT } from './fetch-account';

export const STEP_FETCH_ORGANIZATION = 'fetch-organization';

export const fetchOrganizationStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_ORGANIZATION,
  name: 'Fetch Organization',
  entities: [
    {
      resourceName: 'Organization',
      _type: CTM360_ORGANIZATION,
      _class: EntityClasses.ORGANIZATION,
    },
  ],
  relationships: [
    {
      _type: Relationships.ACCOUNT_HAS_ORGANIZATION._type,
      sourceType: CTM360_ACCOUNT,
      _class: RelationshipClass.HAS,
      targetType: CTM360_ORGANIZATION,
    },
  ],
  dependsOn: [STEP_FETCH_ACCOUNT],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance, logger } = context;
    const { config } = instance;

    const client = createCTM360Client({
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      tenantId: config.tenantId,
    });

    const accountEntity = await jobState.findEntity(
      `ctm360_account:${config.apiKey.substring(0, 8)}`
    );

    if (!accountEntity) {
      logger.warn({ message: 'Account entity not found' });
      return;
    }

    const organization = await client.getOrganization();
    const orgEntity = createOrganizationEntity(organization);

    await jobState.addEntity(orgEntity);

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: orgEntity,
      })
    );

    logger.info({
      organizationName: organization.name,
      domainsCount: organization.domains.length,
    }, 'Fetched organization');
  },
};
