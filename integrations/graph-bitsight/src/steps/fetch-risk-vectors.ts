/**
 * Step: Fetch Risk Vectors
 * Fetches risk vector ratings for each company
 */

import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  createDirectRelationship,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import {
  IntegrationConfig,
  BITSIGHT_COMPANY,
  BITSIGHT_RATING,
  BITSIGHT_RISK_VECTOR,
  EntityClasses,
  Relationships,
} from '../types';
import { createRatingEntity, createRiskVectorEntity } from '../converters';
import { createBitsightClient } from '../client';
import { STEP_FETCH_COMPANIES } from './fetch-companies';

export const STEP_FETCH_RISK_VECTORS = 'fetch-risk-vectors';

export const fetchRiskVectorsStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_RISK_VECTORS,
  name: 'Fetch Risk Vectors',
  entities: [
    {
      resourceName: 'Rating',
      _type: BITSIGHT_RATING,
      _class: EntityClasses.ASSESSMENT,
    },
    {
      resourceName: 'Risk Vector',
      _type: BITSIGHT_RISK_VECTOR,
      _class: EntityClasses.RISK,
    },
  ],
  relationships: [
    {
      _type: Relationships.COMPANY_HAS_RATING._type,
      sourceType: BITSIGHT_COMPANY,
      _class: RelationshipClass.HAS,
      targetType: BITSIGHT_RATING,
    },
    {
      _type: Relationships.RATING_HAS_RISK_VECTOR._type,
      sourceType: BITSIGHT_RATING,
      _class: RelationshipClass.HAS,
      targetType: BITSIGHT_RISK_VECTOR,
    },
  ],
  dependsOn: [STEP_FETCH_COMPANIES],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance, logger } = context;
    const { config } = instance;

    const client = createBitsightClient({ apiKey: config.apiKey });

    await jobState.iterateEntities(
      { _type: BITSIGHT_COMPANY },
      async (companyEntity) => {
        const companyGuid = companyEntity.id as string;

        try {
          // Create rating entity from company data
          const ratingEntity = createRatingEntity(companyGuid, {
            rating: companyEntity.rating as number,
            rating_date: companyEntity.ratingDate as string,
            range: (companyEntity.rating as number) >= 740 ? 'Advanced' :
                   (companyEntity.rating as number) >= 640 ? 'Intermediate' : 'Basic',
            rating_color: (companyEntity.rating as number) >= 740 ? 'green' :
                         (companyEntity.rating as number) >= 640 ? 'yellow' : 'red',
          });

          await jobState.addEntity(ratingEntity);

          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: companyEntity,
              to: ratingEntity,
            })
          );

          // Fetch risk vectors
          const riskVectorsResponse = await client.getRiskVectors(companyGuid);

          for (const riskVector of riskVectorsResponse.risk_vectors || []) {
            const riskVectorEntity = createRiskVectorEntity(companyGuid, riskVector);
            await jobState.addEntity(riskVectorEntity);

            await jobState.addRelationship(
              createDirectRelationship({
                _class: RelationshipClass.HAS,
                from: ratingEntity,
                to: riskVectorEntity,
              })
            );
          }

          logger.info({
            companyGuid,
            riskVectorCount: riskVectorsResponse.risk_vectors?.length || 0,
          }, 'Fetched risk vectors');
        } catch (error) {
          logger.warn({ error, companyGuid }, 'Failed to fetch risk vectors');
        }
      }
    );
  },
};
