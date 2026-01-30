/**
 * Step: Fetch Findings
 * Fetches security findings and vulnerabilities for each company
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
  BITSIGHT_FINDING,
  BITSIGHT_VULNERABILITY,
  EntityClasses,
  Relationships,
} from '../types';
import { createFindingEntity, createVulnerabilityEntity, createAssetEntity } from '../converters';
import { createBitsightClient } from '../client';
import { STEP_FETCH_ASSETS } from './fetch-assets';

export const STEP_FETCH_FINDINGS = 'fetch-findings';

export const fetchFindingsStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_FINDINGS,
  name: 'Fetch Findings',
  entities: [
    {
      resourceName: 'Finding',
      _type: BITSIGHT_FINDING,
      _class: EntityClasses.FINDING,
    },
    {
      resourceName: 'Vulnerability',
      _type: BITSIGHT_VULNERABILITY,
      _class: EntityClasses.VULNERABILITY,
    },
  ],
  relationships: [
    {
      _type: Relationships.ASSET_HAS_FINDING._type,
      sourceType: BITSIGHT_ASSET,
      _class: RelationshipClass.HAS,
      targetType: BITSIGHT_FINDING,
    },
    {
      _type: Relationships.ASSET_HAS_VULNERABILITY._type,
      sourceType: BITSIGHT_ASSET,
      _class: RelationshipClass.HAS,
      targetType: BITSIGHT_VULNERABILITY,
    },
    {
      _type: Relationships.FINDING_IDENTIFIED_VULNERABILITY._type,
      sourceType: BITSIGHT_FINDING,
      _class: RelationshipClass.IDENTIFIED,
      targetType: BITSIGHT_VULNERABILITY,
    },
  ],
  dependsOn: [STEP_FETCH_ASSETS],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance, logger } = context;
    const { config } = instance;

    const client = createBitsightClient({ apiKey: config.apiKey });
    const processedVulns = new Set<string>();

    await jobState.iterateEntities(
      { _type: BITSIGHT_COMPANY },
      async (companyEntity) => {
        const companyGuid = companyEntity.id as string;
        let findingCount = 0;

        try {
          // Fetch findings through pagination
          for await (const finding of client.iterateFindings(companyGuid)) {
            const findingEntity = createFindingEntity(companyGuid, finding);

            // Check if entity already exists
            const existingFinding = await jobState.findEntity(findingEntity._key);
            if (existingFinding) continue;

            await jobState.addEntity(findingEntity);

            // Link findings to affected assets
            for (const affectedAsset of finding.assets || []) {
              const assetKey = affectedAsset.ip_address || affectedAsset.asset || affectedAsset.name;
              const assetEntityKey = `bitsight_asset:${companyGuid}:${assetKey}`;

              const assetEntity = await jobState.findEntity(assetEntityKey);

              if (assetEntity) {
                await jobState.addRelationship(
                  createDirectRelationship({
                    _class: RelationshipClass.HAS,
                    from: assetEntity,
                    to: findingEntity,
                  })
                );
              } else {
                // Create asset entity if it doesn't exist
                const newAssetEntity = createAssetEntity(companyGuid, affectedAsset);
                const existingAsset = await jobState.findEntity(newAssetEntity._key);

                if (!existingAsset) {
                  await jobState.addEntity(newAssetEntity);

                  await jobState.addRelationship(
                    createDirectRelationship({
                      _class: RelationshipClass.HAS,
                      from: companyEntity,
                      to: newAssetEntity,
                    })
                  );
                }

                await jobState.addRelationship(
                  createDirectRelationship({
                    _class: RelationshipClass.HAS,
                    from: existingAsset || newAssetEntity,
                    to: findingEntity,
                  })
                );
              }
            }

            // Check if finding has CVE details (vulnerability)
            const cvePattern = /CVE-\d{4}-\d+/gi;
            const findingDetails = JSON.stringify(finding.details || {});
            const cveMatches = findingDetails.match(cvePattern);

            if (cveMatches) {
              for (const cveId of cveMatches) {
                if (!processedVulns.has(cveId)) {
                  processedVulns.add(cveId);

                  const vulnEntity = createVulnerabilityEntity({
                    cve_id: cveId,
                    severity: finding.severity_category,
                    cvss_score: finding.severity / 10, // Approximate
                    affected_assets: finding.assets.map((a) => a.asset),
                  });

                  await jobState.addEntity(vulnEntity);
                }

                // Create relationship finding -> vulnerability
                const vulnEntityKey = `bitsight_vulnerability:${cveId}`;
                const vulnEntity = await jobState.findEntity(vulnEntityKey);

                if (vulnEntity) {
                  await jobState.addRelationship(
                    createDirectRelationship({
                      _class: RelationshipClass.IDENTIFIED,
                      from: findingEntity,
                      to: vulnEntity,
                    })
                  );

                  // Also link affected assets to vulnerabilities
                  for (const affectedAsset of finding.assets || []) {
                    const assetKey = affectedAsset.ip_address || affectedAsset.asset;
                    const assetEntityKey = `bitsight_asset:${companyGuid}:${assetKey}`;
                    const assetEntity = await jobState.findEntity(assetEntityKey);

                    if (assetEntity) {
                      const relationshipKey = `${assetEntityKey}|has|${vulnEntityKey}`;
                      const existingRelationship = await jobState.findEntity(relationshipKey);

                      if (!existingRelationship) {
                        await jobState.addRelationship(
                          createDirectRelationship({
                            _class: RelationshipClass.HAS,
                            from: assetEntity,
                            to: vulnEntity,
                          })
                        );
                      }
                    }
                  }
                }
              }
            }

            findingCount++;
          }

          logger.info({
            companyGuid,
            findingCount,
            vulnerabilityCount: processedVulns.size,
          }, 'Fetched findings');
        } catch (error) {
          logger.warn({ error, companyGuid }, 'Failed to fetch findings');
        }
      }
    );
  },
};
