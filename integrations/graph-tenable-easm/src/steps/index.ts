/**
 * Tenable EASM Integration Steps
 */

import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  createDirectRelationship,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import {
  IntegrationConfig,
  TENABLE_EASM_ACCOUNT,
  TENABLE_EASM_INVENTORY,
  TENABLE_EASM_ASSET,
  TENABLE_EASM_DOMAIN,
  TENABLE_EASM_SUBDOMAIN,
  TENABLE_EASM_IP,
  TENABLE_EASM_PORT,
  TENABLE_EASM_SERVICE,
  TENABLE_EASM_CERTIFICATE,
  TENABLE_EASM_VULNERABILITY,
  TENABLE_EASM_WEB_APP,
  EntityClasses,
  Relationships,
} from '../types';

import {
  createAccountEntity,
  createInventoryEntity,
  createDomainEntity,
  createSubdomainEntity,
  createIpAddressEntity,
  createPortEntity,
  createServiceEntity,
  createCertificateEntity,
  createVulnerabilityEntity,
  createWebAppEntity,
} from '../converters';

import { createTenableEASMClient } from '../client';

export const STEP_FETCH_ACCOUNT = 'fetch-account';
export const STEP_FETCH_INVENTORIES = 'fetch-inventories';
export const STEP_FETCH_DOMAINS = 'fetch-domains';
export const STEP_FETCH_IPS = 'fetch-ips';
export const STEP_FETCH_CERTIFICATES = 'fetch-certificates';
export const STEP_FETCH_VULNERABILITIES = 'fetch-vulnerabilities';
export const STEP_FETCH_WEB_APPS = 'fetch-web-applications';

export const fetchAccountStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_ACCOUNT,
  name: 'Fetch Account',
  entities: [
    {
      resourceName: 'Account',
      _type: TENABLE_EASM_ACCOUNT,
      _class: EntityClasses.ACCOUNT,
    },
  ],
  relationships: [],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance } = context;
    const { config } = instance;

    const accountEntity = createAccountEntity(config.accessKey);
    await jobState.addEntity(accountEntity);
  },
};

export const fetchInventoriesStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_INVENTORIES,
  name: 'Fetch Inventories',
  entities: [
    {
      resourceName: 'Inventory',
      _type: TENABLE_EASM_INVENTORY,
      _class: EntityClasses.ASSESSMENT,
    },
  ],
  relationships: [
    {
      _type: Relationships.ACCOUNT_HAS_INVENTORY._type,
      sourceType: TENABLE_EASM_ACCOUNT,
      _class: RelationshipClass.HAS,
      targetType: TENABLE_EASM_INVENTORY,
    },
  ],
  dependsOn: [STEP_FETCH_ACCOUNT],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance, logger } = context;
    const { config } = instance;

    const client = createTenableEASMClient({
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
    });

    const accountEntity = await jobState.findEntity(
      `tenable_easm_account:${config.accessKey.substring(0, 8)}`
    );

    if (!accountEntity) {
      logger.warn({ message: 'Account entity not found' });
      return;
    }

    const inventories = await client.getInventories();

    for (const inventory of inventories) {
      // If specific inventory is configured, skip others
      if (config.inventoryId && inventory.id !== config.inventoryId) {
        continue;
      }

      const inventoryEntity = createInventoryEntity(inventory);
      await jobState.addEntity(inventoryEntity);

      await jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: accountEntity,
          to: inventoryEntity,
        })
      );
    }

    logger.info({ inventoryCount: inventories.length }, 'Fetched inventories');
  },
};

export const fetchDomainsStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_DOMAINS,
  name: 'Fetch Domains',
  entities: [
    {
      resourceName: 'Domain',
      _type: TENABLE_EASM_DOMAIN,
      _class: EntityClasses.DOMAIN,
    },
    {
      resourceName: 'Subdomain',
      _type: TENABLE_EASM_SUBDOMAIN,
      _class: EntityClasses.DOMAIN,
    },
  ],
  relationships: [
    {
      _type: Relationships.INVENTORY_HAS_DOMAIN._type,
      sourceType: TENABLE_EASM_INVENTORY,
      _class: RelationshipClass.HAS,
      targetType: TENABLE_EASM_DOMAIN,
    },
    {
      _type: Relationships.DOMAIN_HAS_SUBDOMAIN._type,
      sourceType: TENABLE_EASM_DOMAIN,
      _class: RelationshipClass.HAS,
      targetType: TENABLE_EASM_SUBDOMAIN,
    },
  ],
  dependsOn: [STEP_FETCH_INVENTORIES],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance, logger } = context;
    const { config } = instance;

    const client = createTenableEASMClient({
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
    });

    await jobState.iterateEntities(
      { _type: TENABLE_EASM_INVENTORY },
      async (inventoryEntity) => {
        const inventoryId = inventoryEntity.id as string;
        let domainCount = 0;
        let subdomainCount = 0;

        for await (const domain of client.iterateDomains(inventoryId)) {
          const domainEntity = createDomainEntity(domain);
          await jobState.addEntity(domainEntity);

          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: inventoryEntity,
              to: domainEntity,
            })
          );

          domainCount++;

          // Fetch subdomains
          try {
            for await (const subdomain of client.iterateSubdomains(
              inventoryId,
              domain.id
            )) {
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
            }
          } catch (error) {
            logger.warn({ error, domainId: domain.id }, 'Failed to fetch subdomains');
          }
        }

        logger.info({ inventoryId, domainCount, subdomainCount }, 'Fetched domains');
      }
    );
  },
};

export const fetchIpsStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_IPS,
  name: 'Fetch IP Addresses',
  entities: [
    {
      resourceName: 'IP Address',
      _type: TENABLE_EASM_IP,
      _class: EntityClasses.IPADDRESS,
    },
    {
      resourceName: 'Port',
      _type: TENABLE_EASM_PORT,
      _class: EntityClasses.PORT,
    },
    {
      resourceName: 'Service',
      _type: TENABLE_EASM_SERVICE,
      _class: EntityClasses.SERVICE,
    },
  ],
  relationships: [
    {
      _type: 'tenable_easm_inventory_has_ip',
      sourceType: TENABLE_EASM_INVENTORY,
      _class: RelationshipClass.HAS,
      targetType: TENABLE_EASM_IP,
    },
    {
      _type: Relationships.IP_HAS_PORT._type,
      sourceType: TENABLE_EASM_IP,
      _class: RelationshipClass.HAS,
      targetType: TENABLE_EASM_PORT,
    },
    {
      _type: Relationships.PORT_HAS_SERVICE._type,
      sourceType: TENABLE_EASM_PORT,
      _class: RelationshipClass.HAS,
      targetType: TENABLE_EASM_SERVICE,
    },
  ],
  dependsOn: [STEP_FETCH_INVENTORIES],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance, logger } = context;
    const { config } = instance;

    const client = createTenableEASMClient({
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
    });

    await jobState.iterateEntities(
      { _type: TENABLE_EASM_INVENTORY },
      async (inventoryEntity) => {
        const inventoryId = inventoryEntity.id as string;
        let ipCount = 0;
        let portCount = 0;
        let serviceCount = 0;

        for await (const ip of client.iterateIpAddresses(inventoryId)) {
          const ipEntity = createIpAddressEntity(ip);
          await jobState.addEntity(ipEntity);

          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: inventoryEntity,
              to: ipEntity,
            })
          );

          ipCount++;

          // Process ports and services
          for (const port of ip.ports || []) {
            const portEntity = createPortEntity(ip.id, port);
            await jobState.addEntity(portEntity);

            await jobState.addRelationship(
              createDirectRelationship({
                _class: RelationshipClass.HAS,
                from: ipEntity,
                to: portEntity,
              })
            );

            portCount++;

            // Create service entity if present
            if (port.service) {
              const serviceEntity = createServiceEntity(port.service);
              await jobState.addEntity(serviceEntity);

              await jobState.addRelationship(
                createDirectRelationship({
                  _class: RelationshipClass.HAS,
                  from: portEntity,
                  to: serviceEntity,
                })
              );

              serviceCount++;
            }
          }
        }

        logger.info(
          { inventoryId, ipCount, portCount, serviceCount },
          'Fetched IP addresses'
        );
      }
    );
  },
};

export const fetchCertificatesStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_CERTIFICATES,
  name: 'Fetch Certificates',
  entities: [
    {
      resourceName: 'Certificate',
      _type: TENABLE_EASM_CERTIFICATE,
      _class: EntityClasses.CERTIFICATE,
    },
  ],
  relationships: [
    {
      _type: 'tenable_easm_inventory_has_certificate',
      sourceType: TENABLE_EASM_INVENTORY,
      _class: RelationshipClass.HAS,
      targetType: TENABLE_EASM_CERTIFICATE,
    },
  ],
  dependsOn: [STEP_FETCH_INVENTORIES],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance, logger } = context;
    const { config } = instance;

    const client = createTenableEASMClient({
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
    });

    await jobState.iterateEntities(
      { _type: TENABLE_EASM_INVENTORY },
      async (inventoryEntity) => {
        const inventoryId = inventoryEntity.id as string;
        let certCount = 0;

        for await (const cert of client.iterateCertificates(inventoryId)) {
          const certEntity = createCertificateEntity(cert);
          await jobState.addEntity(certEntity);

          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: inventoryEntity,
              to: certEntity,
            })
          );

          certCount++;
        }

        logger.info({ inventoryId, certCount }, 'Fetched certificates');
      }
    );
  },
};

export const fetchVulnerabilitiesStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_VULNERABILITIES,
  name: 'Fetch Vulnerabilities',
  entities: [
    {
      resourceName: 'Vulnerability',
      _type: TENABLE_EASM_VULNERABILITY,
      _class: EntityClasses.VULNERABILITY,
    },
  ],
  relationships: [
    {
      _type: 'tenable_easm_inventory_has_vulnerability',
      sourceType: TENABLE_EASM_INVENTORY,
      _class: RelationshipClass.HAS,
      targetType: TENABLE_EASM_VULNERABILITY,
    },
  ],
  dependsOn: [STEP_FETCH_INVENTORIES],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance, logger } = context;
    const { config } = instance;

    const client = createTenableEASMClient({
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
    });

    await jobState.iterateEntities(
      { _type: TENABLE_EASM_INVENTORY },
      async (inventoryEntity) => {
        const inventoryId = inventoryEntity.id as string;
        let vulnCount = 0;

        for await (const vuln of client.iterateVulnerabilities(inventoryId)) {
          const vulnEntity = createVulnerabilityEntity(vuln);
          await jobState.addEntity(vulnEntity);

          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: inventoryEntity,
              to: vulnEntity,
            })
          );

          vulnCount++;
        }

        logger.info({ inventoryId, vulnCount }, 'Fetched vulnerabilities');
      }
    );
  },
};

export const fetchWebAppsStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_WEB_APPS,
  name: 'Fetch Web Applications',
  entities: [
    {
      resourceName: 'Web Application',
      _type: TENABLE_EASM_WEB_APP,
      _class: EntityClasses.APPLICATION,
    },
  ],
  relationships: [
    {
      _type: 'tenable_easm_inventory_has_web_application',
      sourceType: TENABLE_EASM_INVENTORY,
      _class: RelationshipClass.HAS,
      targetType: TENABLE_EASM_WEB_APP,
    },
  ],
  dependsOn: [STEP_FETCH_INVENTORIES],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance, logger } = context;
    const { config } = instance;

    if (config.includeWebApps === false) {
      logger.info('Web application ingestion disabled');
      return;
    }

    const client = createTenableEASMClient({
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
    });

    await jobState.iterateEntities(
      { _type: TENABLE_EASM_INVENTORY },
      async (inventoryEntity) => {
        const inventoryId = inventoryEntity.id as string;
        let webAppCount = 0;

        for await (const webapp of client.iterateWebApplications(inventoryId)) {
          const webAppEntity = createWebAppEntity(webapp);
          await jobState.addEntity(webAppEntity);

          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: inventoryEntity,
              to: webAppEntity,
            })
          );

          webAppCount++;
        }

        logger.info({ inventoryId, webAppCount }, 'Fetched web applications');
      }
    );
  },
};

export const integrationSteps: IntegrationStep<IntegrationConfig>[] = [
  fetchAccountStep,
  fetchInventoriesStep,
  fetchDomainsStep,
  fetchIpsStep,
  fetchCertificatesStep,
  fetchVulnerabilitiesStep,
  fetchWebAppsStep,
];
