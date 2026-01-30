/**
 * Step: Fetch Domains
 * Fetches domains and subdomains from CTM360
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
  CTM360_DOMAIN,
  CTM360_SUBDOMAIN,
  CTM360_IP_ADDRESS,
  EntityClasses,
  Relationships,
} from '../types';
import {
  createDomainEntity,
  createSubdomainEntity,
  createIpAddressEntity,
} from '../converters';
import { createCTM360Client } from '../client';
import { STEP_FETCH_ORGANIZATION } from './fetch-organization';

export const STEP_FETCH_DOMAINS = 'fetch-domains';

export const fetchDomainsStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_DOMAINS,
  name: 'Fetch Domains',
  entities: [
    {
      resourceName: 'Domain',
      _type: CTM360_DOMAIN,
      _class: EntityClasses.DOMAIN,
    },
    {
      resourceName: 'Subdomain',
      _type: CTM360_SUBDOMAIN,
      _class: EntityClasses.DOMAIN,
    },
    {
      resourceName: 'IP Address',
      _type: CTM360_IP_ADDRESS,
      _class: EntityClasses.IPADDRESS,
    },
  ],
  relationships: [
    {
      _type: Relationships.ORGANIZATION_HAS_DOMAIN._type,
      sourceType: CTM360_ORGANIZATION,
      _class: RelationshipClass.HAS,
      targetType: CTM360_DOMAIN,
    },
    {
      _type: Relationships.DOMAIN_HAS_SUBDOMAIN._type,
      sourceType: CTM360_DOMAIN,
      _class: RelationshipClass.HAS,
      targetType: CTM360_SUBDOMAIN,
    },
    {
      _type: Relationships.SUBDOMAIN_HAS_IP._type,
      sourceType: CTM360_SUBDOMAIN,
      _class: RelationshipClass.HAS,
      targetType: CTM360_IP_ADDRESS,
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

    const processedIps = new Set<string>();

    await jobState.iterateEntities(
      { _type: CTM360_ORGANIZATION },
      async (orgEntity) => {
        let domainCount = 0;
        let subdomainCount = 0;

        for await (const domain of client.iterateDomains()) {
          const domainEntity = createDomainEntity(domain);
          await jobState.addEntity(domainEntity);

          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: orgEntity,
              to: domainEntity,
            })
          );

          domainCount++;

          // Fetch subdomains for this domain
          try {
            for await (const subdomain of client.iterateSubdomains(domain.id)) {
              const subdomainEntity = createSubdomainEntity(subdomain);
              await jobState.addEntity(subdomainEntity);

              await jobState.addRelationship(
                createDirectRelationship({
                  _class: RelationshipClass.HAS,
                  from: domainEntity,
                  to: subdomainEntity,
                })
              );

              subdomainCount++;

              // Create IP address entities for the subdomain
              for (const ipAddress of subdomain.ip_addresses || []) {
                if (processedIps.has(ipAddress)) continue;
                processedIps.add(ipAddress);

                const ipEntity = createIpAddressEntity({
                  id: ipAddress,
                  ip_address: ipAddress,
                  version: ipAddress.includes(':') ? 6 : 4,
                  is_public: true,
                  country: '',
                  asn: '',
                  organization: '',
                  services: [],
                  first_seen: subdomain.first_seen,
                  last_seen: subdomain.last_seen,
                });

                await jobState.addEntity(ipEntity);

                await jobState.addRelationship(
                  createDirectRelationship({
                    _class: RelationshipClass.HAS,
                    from: subdomainEntity,
                    to: ipEntity,
                  })
                );
              }
            }
          } catch (error) {
            logger.warn({ error, domainId: domain.id }, 'Failed to fetch subdomains');
          }
        }

        logger.info({
          domainCount,
          subdomainCount,
          ipCount: processedIps.size,
        }, 'Fetched domains and subdomains');
      }
    );
  },
};
