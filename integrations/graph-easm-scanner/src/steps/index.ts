/**
 * Generic EASM Scanner Integration Steps
 */

import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  createDirectRelationship,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import {
  IntegrationConfig,
  EASM_SCANNER_ACCOUNT,
  EASM_SCANNER_SCAN,
  EASM_SCANNER_ASSET,
  EASM_SCANNER_DOMAIN,
  EASM_SCANNER_SUBDOMAIN,
  EASM_SCANNER_IP,
  EASM_SCANNER_PORT,
  EASM_SCANNER_SERVICE,
  EASM_SCANNER_VULNERABILITY,
  EASM_SCANNER_FINDING,
  EASM_SCANNER_CERTIFICATE,
  EASM_SCANNER_TECHNOLOGY,
  EntityClasses,
  Relationships,
} from '../types';

import {
  createAccountEntity,
  createScanEntity,
  createAssetEntity,
  createDomainEntity,
  createSubdomainEntity,
  createIpAddressEntity,
  createPortEntity,
  createServiceEntity,
  createVulnerabilityEntity,
  createFindingEntity,
  createCertificateEntity,
  createTechnologyEntity,
} from '../converters';

import { createEASMScannerClient } from '../client';

export const STEP_FETCH_ACCOUNT = 'fetch-account';
export const STEP_FETCH_SCAN_DATA = 'fetch-scan-data';

export const fetchAccountStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_ACCOUNT,
  name: 'Fetch Account',
  entities: [
    {
      resourceName: 'Account',
      _type: EASM_SCANNER_ACCOUNT,
      _class: EntityClasses.ACCOUNT,
    },
  ],
  relationships: [],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance } = context;
    const { config } = instance;

    const accountEntity = createAccountEntity(config.scannerName);
    await jobState.addEntity(accountEntity);
  },
};

export const fetchScanDataStep: IntegrationStep<IntegrationConfig> = {
  id: STEP_FETCH_SCAN_DATA,
  name: 'Fetch Scan Data',
  entities: [
    { resourceName: 'Scan', _type: EASM_SCANNER_SCAN, _class: EntityClasses.ASSESSMENT },
    { resourceName: 'Asset', _type: EASM_SCANNER_ASSET, _class: EntityClasses.HOST },
    { resourceName: 'Domain', _type: EASM_SCANNER_DOMAIN, _class: EntityClasses.DOMAIN },
    { resourceName: 'Subdomain', _type: EASM_SCANNER_SUBDOMAIN, _class: EntityClasses.DOMAIN },
    { resourceName: 'IP Address', _type: EASM_SCANNER_IP, _class: EntityClasses.IPADDRESS },
    { resourceName: 'Port', _type: EASM_SCANNER_PORT, _class: EntityClasses.PORT },
    { resourceName: 'Service', _type: EASM_SCANNER_SERVICE, _class: EntityClasses.SERVICE },
    { resourceName: 'Vulnerability', _type: EASM_SCANNER_VULNERABILITY, _class: EntityClasses.VULNERABILITY },
    { resourceName: 'Finding', _type: EASM_SCANNER_FINDING, _class: EntityClasses.FINDING },
    { resourceName: 'Certificate', _type: EASM_SCANNER_CERTIFICATE, _class: EntityClasses.CERTIFICATE },
    { resourceName: 'Technology', _type: EASM_SCANNER_TECHNOLOGY, _class: EntityClasses.COMPONENT },
  ],
  relationships: [
    { _type: Relationships.ACCOUNT_HAS_SCAN._type, sourceType: EASM_SCANNER_ACCOUNT, _class: RelationshipClass.HAS, targetType: EASM_SCANNER_SCAN },
    { _type: Relationships.SCAN_IDENTIFIED_ASSET._type, sourceType: EASM_SCANNER_SCAN, _class: RelationshipClass.IDENTIFIED, targetType: EASM_SCANNER_ASSET },
    { _type: Relationships.SCAN_IDENTIFIED_DOMAIN._type, sourceType: EASM_SCANNER_SCAN, _class: RelationshipClass.IDENTIFIED, targetType: EASM_SCANNER_DOMAIN },
    { _type: Relationships.DOMAIN_HAS_SUBDOMAIN._type, sourceType: EASM_SCANNER_DOMAIN, _class: RelationshipClass.HAS, targetType: EASM_SCANNER_SUBDOMAIN },
    { _type: Relationships.ASSET_HAS_IP._type, sourceType: EASM_SCANNER_ASSET, _class: RelationshipClass.HAS, targetType: EASM_SCANNER_IP },
    { _type: Relationships.IP_HAS_PORT._type, sourceType: EASM_SCANNER_IP, _class: RelationshipClass.HAS, targetType: EASM_SCANNER_PORT },
    { _type: Relationships.PORT_HAS_SERVICE._type, sourceType: EASM_SCANNER_PORT, _class: RelationshipClass.HAS, targetType: EASM_SCANNER_SERVICE },
    { _type: Relationships.ASSET_HAS_VULNERABILITY._type, sourceType: EASM_SCANNER_ASSET, _class: RelationshipClass.HAS, targetType: EASM_SCANNER_VULNERABILITY },
    { _type: Relationships.SCAN_IDENTIFIED_VULNERABILITY._type, sourceType: EASM_SCANNER_SCAN, _class: RelationshipClass.IDENTIFIED, targetType: EASM_SCANNER_VULNERABILITY },
    { _type: Relationships.SCAN_IDENTIFIED_FINDING._type, sourceType: EASM_SCANNER_SCAN, _class: RelationshipClass.IDENTIFIED, targetType: EASM_SCANNER_FINDING },
    { _type: Relationships.ASSET_HAS_CERTIFICATE._type, sourceType: EASM_SCANNER_ASSET, _class: RelationshipClass.HAS, targetType: EASM_SCANNER_CERTIFICATE },
    { _type: Relationships.SERVICE_USES_TECHNOLOGY._type, sourceType: EASM_SCANNER_SERVICE, _class: RelationshipClass.USES, targetType: EASM_SCANNER_TECHNOLOGY },
  ],
  dependsOn: [STEP_FETCH_ACCOUNT],
  executionHandler: async (
    context: IntegrationStepExecutionContext<IntegrationConfig>
  ): Promise<void> => {
    const { jobState, instance, logger } = context;
    const { config } = instance;

    const client = createEASMScannerClient({
      scannerName: config.scannerName,
      dataSourceType: config.dataSourceType,
      dataFilePath: config.dataFilePath,
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      apiAuthHeader: config.apiAuthHeader,
    });

    const accountEntity = await jobState.findEntity(`easm_scanner_account:${config.scannerName}`);
    if (!accountEntity) {
      logger.warn({ message: 'Account entity not found' });
      return;
    }

    // Load the scan report
    const report = await client.loadReport();
    const scanId = report.scan.id;

    // Create scan entity
    const scanEntity = createScanEntity(report.scan);
    await jobState.addEntity(scanEntity);
    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: scanEntity,
      })
    );

    // Track created entities for relationship building
    const domainEntities = new Map<string, ReturnType<typeof createDomainEntity>>();
    const ipEntities = new Map<string, ReturnType<typeof createIpAddressEntity>>();
    const portEntities = new Map<string, ReturnType<typeof createPortEntity>>();

    // Process domains
    if (report.domains) {
      for (const domain of report.domains) {
        const domainEntity = createDomainEntity(scanId, domain);
        await jobState.addEntity(domainEntity);
        domainEntities.set(domain.domain, domainEntity);

        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.IDENTIFIED,
            from: scanEntity,
            to: domainEntity,
          })
        );
      }
      logger.info({ count: report.domains.length }, 'Processed domains');
    }

    // Process subdomains
    if (report.subdomains) {
      for (const subdomain of report.subdomains) {
        const subdomainEntity = createSubdomainEntity(scanId, subdomain);
        await jobState.addEntity(subdomainEntity);

        // Link to parent domain if exists
        const parentDomainEntity = domainEntities.get(subdomain.parent_domain);
        if (parentDomainEntity) {
          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: parentDomainEntity,
              to: subdomainEntity,
            })
          );
        }
      }
      logger.info({ count: report.subdomains.length }, 'Processed subdomains');
    }

    // Process IP addresses
    if (report.ip_addresses) {
      for (const ip of report.ip_addresses) {
        const ipEntity = createIpAddressEntity(scanId, ip);
        await jobState.addEntity(ipEntity);
        ipEntities.set(ip.ip_address, ipEntity);

        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.IDENTIFIED,
            from: scanEntity,
            to: ipEntity,
          })
        );
      }
      logger.info({ count: report.ip_addresses.length }, 'Processed IP addresses');
    }

    // Process ports and services
    if (report.ports) {
      for (const port of report.ports) {
        const portEntity = createPortEntity(scanId, port);
        await jobState.addEntity(portEntity);
        portEntities.set(`${port.ip_address}:${port.port}:${port.protocol}`, portEntity);

        // Link to IP if exists
        const ipEntity = ipEntities.get(port.ip_address);
        if (ipEntity) {
          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: ipEntity,
              to: portEntity,
            })
          );
        }

        // Create service entity if service info is present
        if (port.service_name) {
          const serviceEntity = createServiceEntity(scanId, port);
          await jobState.addEntity(serviceEntity);

          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: portEntity,
              to: serviceEntity,
            })
          );
        }
      }
      logger.info({ count: report.ports.length }, 'Processed ports');
    }

    // Process assets
    if (report.assets) {
      for (const asset of report.assets) {
        const assetEntity = createAssetEntity(scanId, asset);
        await jobState.addEntity(assetEntity);

        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.IDENTIFIED,
            from: scanEntity,
            to: assetEntity,
          })
        );
      }
      logger.info({ count: report.assets.length }, 'Processed assets');
    }

    // Process vulnerabilities
    if (report.vulnerabilities) {
      for (const vuln of report.vulnerabilities) {
        const vulnEntity = createVulnerabilityEntity(scanId, vuln);
        await jobState.addEntity(vulnEntity);

        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.IDENTIFIED,
            from: scanEntity,
            to: vulnEntity,
          })
        );
      }
      logger.info({ count: report.vulnerabilities.length }, 'Processed vulnerabilities');
    }

    // Process findings
    if (report.findings) {
      for (const finding of report.findings) {
        const findingEntity = createFindingEntity(scanId, finding);
        await jobState.addEntity(findingEntity);

        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.IDENTIFIED,
            from: scanEntity,
            to: findingEntity,
          })
        );
      }
      logger.info({ count: report.findings.length }, 'Processed findings');
    }

    // Process certificates
    if (report.certificates) {
      for (const cert of report.certificates) {
        const certEntity = createCertificateEntity(scanId, cert);
        await jobState.addEntity(certEntity);

        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.IDENTIFIED,
            from: scanEntity,
            to: certEntity,
          })
        );
      }
      logger.info({ count: report.certificates.length }, 'Processed certificates');
    }

    // Process technologies
    if (report.technologies) {
      for (const tech of report.technologies) {
        const techEntity = createTechnologyEntity(scanId, tech);
        await jobState.addEntity(techEntity);

        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.IDENTIFIED,
            from: scanEntity,
            to: techEntity,
          })
        );
      }
      logger.info({ count: report.technologies.length }, 'Processed technologies');
    }

    logger.info({
      scanId,
      scanName: report.scan.name,
      scannerName: report.scan.scanner_name,
    }, 'Completed scan data import');
  },
};

export const integrationSteps: IntegrationStep<IntegrationConfig>[] = [
  fetchAccountStep,
  fetchScanDataStep,
];
