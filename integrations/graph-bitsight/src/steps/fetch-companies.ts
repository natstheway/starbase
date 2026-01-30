/**
 * Step: Fetch Companies
 * Fetches company data from Bitsight including the primary company and subsidiaries
 */

import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  createDirectRelationship,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig, BITSIGHT_ACCOUNT, BITSIGHT_COMPANY, EntityClasses, Relationships } from '../types';
import { createCompanyEntity, createRatingEntity, createRiskVectorEntity } from '../converters';
import { createBitsightClient } from '../client';
import { STEP_FETCH_ACCOUNT } from './fetch-account';

export const STEP_FETCH_COMPANIES = 'fetch-companies';

export const fetchCompaniesStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_COMPANIES,
  name: 'Fetch Companies',
  entities: [
    {
      resourceName: 'Company',
      _type: BITSIGHT_COMPANY,
      _class: EntityClasses.ORGANIZATION,
    },
  ],
  relationships: [
    {
      _type: Relationships.ACCOUNT_HAS_COMPANY._type,
      sourceType: BITSIGHT_ACCOUNT,
      _class: RelationshipClass.HAS,
      targetType: BITSIGHT_COMPANY,
    },
  ],
  dependsOn: [STEP_FETCH_ACCOUNT],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance, logger } = context;
    const { config } = instance;

    const client = createBitsightClient({ apiKey: config.apiKey });

    // Get the account entity
    const accountEntity = await jobState.findEntity(`bitsight_account:${config.apiKey.substring(0, 8)}`);

    if (!accountEntity) {
      logger.warn({ message: 'Account entity not found, skipping company relationships' });
      return;
    }

    // Fetch my company (primary company)
    const myCompany = await client.getMyCompany();
    const companyEntity = createCompanyEntity(myCompany);
    await jobState.addEntity(companyEntity);

    // Create relationship: Account -> Company
    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: companyEntity,
      })
    );

    logger.info({
      companyName: myCompany.name,
      companyGuid: myCompany.guid,
      rating: myCompany.rating,
    }, 'Fetched primary company');

    // Optionally fetch subsidiaries
    if (config.includeSubsidiaries) {
      try {
        const subsidiariesResponse = await client.getSubsidiaries(myCompany.guid);

        for (const subsidiary of subsidiariesResponse.results) {
          const subsidiaryEntity = createCompanyEntity(subsidiary);
          await jobState.addEntity(subsidiaryEntity);

          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: accountEntity,
              to: subsidiaryEntity,
            })
          );
        }

        logger.info({
          subsidiaryCount: subsidiariesResponse.results.length,
        }, 'Fetched subsidiaries');
      } catch (error) {
        logger.warn({ error }, 'Failed to fetch subsidiaries');
      }
    }

    // Fetch portfolio companies if available
    try {
      const portfolio = await client.getPortfolio();

      for (const company of portfolio.results) {
        // Skip if already added (my company)
        if (company.guid === myCompany.guid) continue;

        const portfolioCompanyEntity = createCompanyEntity(company);

        // Check if entity already exists (might be a subsidiary)
        const existing = await jobState.findEntity(portfolioCompanyEntity._key);
        if (!existing) {
          await jobState.addEntity(portfolioCompanyEntity);

          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: accountEntity,
              to: portfolioCompanyEntity,
            })
          );
        }
      }

      logger.info({
        portfolioCount: portfolio.count,
      }, 'Fetched portfolio companies');
    } catch (error) {
      logger.warn({ error }, 'Failed to fetch portfolio');
    }
  },
};
