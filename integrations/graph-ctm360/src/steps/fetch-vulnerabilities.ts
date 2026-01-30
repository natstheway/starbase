/**
 * Step: Fetch Vulnerabilities
 * Fetches vulnerability findings from CTM360
 */

import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  createDirectRelationship,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import {
  IntegrationConfig,
  CTM360_ORGANIZATION,
  CTM360_VULNERABILITY,
  CTM360_EXPOSURE,
  EntityClasses,
  Relationships,
} from '../types';
import { createVulnerabilityEntity, createExposureEntity } from '../converters';
import { createCTM360Client } from '../client';
import { STEP_FETCH_DOMAINS } from './fetch-domains';

export const STEP_FETCH_VULNERABILITIES = 'fetch-vulnerabilities';

export const fetchVulnerabilitiesStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_VULNERABILITIES,
  name: 'Fetch Vulnerabilities',
  entities: [
    {
      resourceName: 'Vulnerability',
      _type: CTM360_VULNERABILITY,
      _class: EntityClasses.VULNERABILITY,
    },
    {
      resourceName: 'Exposure',
      _type: CTM360_EXPOSURE,
      _class: EntityClasses.RISK,
    },
  ],
  relationships: [
    {
      _type: 'ctm360_organization_has_vulnerability',
      sourceType: CTM360_ORGANIZATION,
      _class: RelationshipClass.HAS,
      targetType: CTM360_VULNERABILITY,
    },
    {
      _type: Relationships.ORGANIZATION_HAS_EXPOSURE._type,
      sourceType: CTM360_ORGANIZATION,
      _class: RelationshipClass.HAS,
      targetType: CTM360_EXPOSURE,
    },
  ],
  dependsOn: [STEP_FETCH_DOMAINS],
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

    await jobState.iterateEntities(
      { _type: CTM360_ORGANIZATION },
      async (orgEntity) => {
        let vulnCount = 0;
        let exposureCount = 0;

        // Fetch vulnerabilities
        try {
          for await (const vuln of client.iterateVulnerabilities()) {
            const vulnEntity = createVulnerabilityEntity(vuln);
            await jobState.addEntity(vulnEntity);

            await jobState.addRelationship(
              createDirectRelationship({
                _class: RelationshipClass.HAS,
                from: orgEntity,
                to: vulnEntity,
              })
            );

            vulnCount++;
          }
        } catch (error) {
          logger.warn({ error }, 'Failed to fetch vulnerabilities');
        }

        // Fetch exposures
        try {
          for await (const exposure of client.iterateExposures()) {
            const exposureEntity = createExposureEntity(exposure);
            await jobState.addEntity(exposureEntity);

            await jobState.addRelationship(
              createDirectRelationship({
                _class: RelationshipClass.HAS,
                from: orgEntity,
                to: exposureEntity,
              })
            );

            exposureCount++;
          }
        } catch (error) {
          logger.warn({ error }, 'Failed to fetch exposures');
        }

        logger.info({
          vulnerabilityCount: vulnCount,
          exposureCount,
        }, 'Fetched vulnerabilities and exposures');
      }
    );
  },
};
