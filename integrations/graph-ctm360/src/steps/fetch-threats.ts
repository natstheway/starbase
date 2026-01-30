/**
 * Step: Fetch Threats
 * Fetches threat intelligence, data leaks, and brand abuse incidents
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
  CTM360_THREAT,
  CTM360_LEAK,
  CTM360_BRAND_ABUSE,
  EntityClasses,
  Relationships,
} from '../types';
import {
  createThreatEntity,
  createDataLeakEntity,
  createBrandAbuseEntity,
} from '../converters';
import { createCTM360Client } from '../client';
import { STEP_FETCH_ORGANIZATION } from './fetch-organization';

export const STEP_FETCH_THREATS = 'fetch-threats';

export const fetchThreatsStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_THREATS,
  name: 'Fetch Threats',
  entities: [
    {
      resourceName: 'Threat',
      _type: CTM360_THREAT,
      _class: EntityClasses.THREAT,
    },
    {
      resourceName: 'Data Leak',
      _type: CTM360_LEAK,
      _class: EntityClasses.RECORD,
    },
    {
      resourceName: 'Brand Abuse',
      _type: CTM360_BRAND_ABUSE,
      _class: EntityClasses.RECORD,
    },
  ],
  relationships: [
    {
      _type: Relationships.ORGANIZATION_HAS_THREAT._type,
      sourceType: CTM360_ORGANIZATION,
      _class: RelationshipClass.HAS,
      targetType: CTM360_THREAT,
    },
    {
      _type: Relationships.ORGANIZATION_HAS_LEAK._type,
      sourceType: CTM360_ORGANIZATION,
      _class: RelationshipClass.HAS,
      targetType: CTM360_LEAK,
    },
    {
      _type: Relationships.ORGANIZATION_HAS_BRAND_ABUSE._type,
      sourceType: CTM360_ORGANIZATION,
      _class: RelationshipClass.HAS,
      targetType: CTM360_BRAND_ABUSE,
    },
  ],
  dependsOn: [STEP_FETCH_ORGANIZATION],
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
        let threatCount = 0;
        let leakCount = 0;
        let brandAbuseCount = 0;

        // Fetch threats if enabled
        if (config.includeThreats !== false) {
          try {
            for await (const threat of client.iterateThreats()) {
              const threatEntity = createThreatEntity(threat);
              await jobState.addEntity(threatEntity);

              await jobState.addRelationship(
                createDirectRelationship({
                  _class: RelationshipClass.HAS,
                  from: orgEntity,
                  to: threatEntity,
                })
              );

              threatCount++;
            }
          } catch (error) {
            logger.warn({ error }, 'Failed to fetch threats');
          }
        }

        // Fetch data leaks if enabled
        if (config.includeDataLeaks !== false) {
          try {
            for await (const leak of client.iterateDataLeaks()) {
              const leakEntity = createDataLeakEntity(leak);
              await jobState.addEntity(leakEntity);

              await jobState.addRelationship(
                createDirectRelationship({
                  _class: RelationshipClass.HAS,
                  from: orgEntity,
                  to: leakEntity,
                })
              );

              leakCount++;
            }
          } catch (error) {
            logger.warn({ error }, 'Failed to fetch data leaks');
          }
        }

        // Fetch brand abuse if enabled
        if (config.includeBrandAbuse !== false) {
          try {
            for await (const abuse of client.iterateBrandAbuse()) {
              const abuseEntity = createBrandAbuseEntity(abuse);
              await jobState.addEntity(abuseEntity);

              await jobState.addRelationship(
                createDirectRelationship({
                  _class: RelationshipClass.HAS,
                  from: orgEntity,
                  to: abuseEntity,
                })
              );

              brandAbuseCount++;
            }
          } catch (error) {
            logger.warn({ error }, 'Failed to fetch brand abuse incidents');
          }
        }

        logger.info({
          threatCount,
          leakCount,
          brandAbuseCount,
        }, 'Fetched threat intelligence');
      }
    );
  },
};
