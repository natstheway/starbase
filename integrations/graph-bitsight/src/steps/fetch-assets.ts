/**
 * Step: Fetch Assets
 * Fetches external assets (IPs, domains) for each company
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
  BITSIGHT_ASSET,
  BITSIGHT_DOMAIN,
  BITSIGHT_IP_ADDRESS,
  EntityClasses,
  Relationships,
} from '../types';
import { createAssetEntity, createDomainEntity, createIpAddressEntity } from '../converters';
import { createBitsightClient } from '../client';
import { STEP_FETCH_COMPANIES } from './fetch-companies';

export const STEP_FETCH_ASSETS = 'fetch-assets';

export const fetchAssetsStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_ASSETS,
  name: 'Fetch Assets',
  entities: [
    {
      resourceName: 'Asset',
      _type: BITSIGHT_ASSET,
      _class: EntityClasses.HOST,
    },
    {
      resourceName: 'Domain',
      _type: BITSIGHT_DOMAIN,
      _class: EntityClasses.DOMAIN,
    },
    {
      resourceName: 'IP Address',
      _type: BITSIGHT_IP_ADDRESS,
      _class: EntityClasses.IPADDRESS,
    },
  ],
  relationships: [
    {
      _type: Relationships.COMPANY_HAS_ASSET._type,
      sourceType: BITSIGHT_COMPANY,
      _class: RelationshipClass.HAS,
      targetType: BITSIGHT_ASSET,
    },
    {
      _type: Relationships.ASSET_HAS_DOMAIN._type,
      sourceType: BITSIGHT_ASSET,
      _class: RelationshipClass.HAS,
      targetType: BITSIGHT_DOMAIN,
    },
    {
      _type: Relationships.ASSET_HAS_IP._type,
      sourceType: BITSIGHT_ASSET,
      _class: RelationshipClass.HAS,
      targetType: BITSIGHT_IP_ADDRESS,
    },
  ],
  dependsOn: [STEP_FETCH_COMPANIES],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance, logger } = context;
    const { config } = instance;

    const client = createBitsightClient({ apiKey: config.apiKey });
    const processedIps = new Set<string>();
    const processedDomains = new Set<string>();

    await jobState.iterateEntities(
      { _type: BITSIGHT_COMPANY },
      async (companyEntity) => {
        const companyGuid = companyEntity.id as string;
        let assetCount = 0;

        try {
          // Fetch assets through pagination
          for await (const asset of client.iterateAssets(companyGuid)) {
            const assetEntity = createAssetEntity(companyGuid, asset);

            // Check if entity already exists
            const existing = await jobState.findEntity(assetEntity._key);
            if (existing) continue;

            await jobState.addEntity(assetEntity);

            await jobState.addRelationship(
              createDirectRelationship({
                _class: RelationshipClass.HAS,
                from: companyEntity,
                to: assetEntity,
              })
            );

            // Create IP address entity if applicable
            if (asset.ip_address && !processedIps.has(asset.ip_address)) {
              processedIps.add(asset.ip_address);

              const ipEntity = createIpAddressEntity(companyGuid, asset.ip_address, {
                country: asset.country,
                hostedBy: asset.hosted_by,
              });

              await jobState.addEntity(ipEntity);

              await jobState.addRelationship(
                createDirectRelationship({
                  _class: RelationshipClass.HAS,
                  from: assetEntity,
                  to: ipEntity,
                })
              );
            }

            // Create domain entity if the asset is a domain
            if (asset.asset_type === 'DOMAIN' && !processedDomains.has(asset.asset)) {
              processedDomains.add(asset.asset);

              const domainEntity = createDomainEntity(companyGuid, asset.asset);
              await jobState.addEntity(domainEntity);

              await jobState.addRelationship(
                createDirectRelationship({
                  _class: RelationshipClass.HAS,
                  from: assetEntity,
                  to: domainEntity,
                })
              );
            }

            assetCount++;
          }

          // Also fetch observed IPs
          try {
            const observedIps = await client.getObservedIps(companyGuid, { limit: 1000 });

            for (const ipData of observedIps.results) {
              if (processedIps.has(ipData.ip_address)) continue;
              processedIps.add(ipData.ip_address);

              const ipEntity = createIpAddressEntity(companyGuid, ipData.ip_address, {
                country: ipData.country_code,
                hostedBy: ipData.hosted_by,
              });

              // Check if entity already exists
              const existing = await jobState.findEntity(ipEntity._key);
              if (!existing) {
                await jobState.addEntity(ipEntity);
              }
            }
          } catch (error) {
            logger.warn({ error, companyGuid }, 'Failed to fetch observed IPs');
          }

          logger.info({
            companyGuid,
            assetCount,
            ipCount: processedIps.size,
            domainCount: processedDomains.size,
          }, 'Fetched assets');
        } catch (error) {
          logger.warn({ error, companyGuid }, 'Failed to fetch assets');
        }
      }
    );
  },
};
