/**
 * Tenable EASM Entity Converters
 */

import {
  createIntegrationEntity,
  Entity,
  parseTimePropertyValue,
} from '@jupiterone/integration-sdk-core';

import {
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
  TENABLE_EASM_TECHNOLOGY,
  TENABLE_EASM_WEB_APP,
  EntityClasses,
  TenableEASMInventory,
  TenableEASMAsset,
  TenableEASMDomain,
  TenableEASMSubdomain,
  TenableEASMIpAddress,
  TenableEASMPort,
  TenableEASMService,
  TenableEASMCertificate,
  TenableEASMVulnerability,
  TenableEASMTechnology,
  TenableEASMWebApplication,
} from '../types';

export function createAccountEntity(accessKey: string): Entity {
  return createIntegrationEntity({
    entityData: {
      source: { accessKey: '***' },
      assign: {
        _key: `tenable_easm_account:${accessKey.substring(0, 8)}`,
        _type: TENABLE_EASM_ACCOUNT,
        _class: EntityClasses.ACCOUNT,
        name: 'Tenable EASM Account',
        displayName: 'Tenable Attack Surface Management',
        vendor: 'Tenable',
        product: 'Attack Surface Management',
      },
    },
  });
}

export function createInventoryEntity(inventory: TenableEASMInventory): Entity {
  return createIntegrationEntity({
    entityData: {
      source: inventory,
      assign: {
        _key: `tenable_easm_inventory:${inventory.id}`,
        _type: TENABLE_EASM_INVENTORY,
        _class: EntityClasses.ASSESSMENT,
        id: inventory.id,
        name: inventory.name,
        displayName: inventory.name,
        description: inventory.description,
        assetCount: inventory.asset_count,
        domainCount: inventory.domain_count,
        ipCount: inventory.ip_count,
        createdOn: parseTimePropertyValue(inventory.created_at),
        updatedOn: parseTimePropertyValue(inventory.updated_at),
      },
    },
  });
}

export function createAssetEntity(asset: TenableEASMAsset): Entity {
  return createIntegrationEntity({
    entityData: {
      source: asset,
      assign: {
        _key: `tenable_easm_asset:${asset.id}`,
        _type: TENABLE_EASM_ASSET,
        _class: EntityClasses.HOST,
        id: asset.id,
        name: asset.value,
        displayName: asset.value,
        assetType: asset.type,
        value: asset.value,
        confidence: asset.confidence,
        attribution: asset.attribution,
        tags: asset.tags,
        firstSeen: parseTimePropertyValue(asset.first_seen),
        lastSeen: parseTimePropertyValue(asset.last_seen),
      },
    },
  });
}

export function createDomainEntity(domain: TenableEASMDomain): Entity {
  return createIntegrationEntity({
    entityData: {
      source: domain,
      assign: {
        _key: `tenable_easm_domain:${domain.id}`,
        _type: TENABLE_EASM_DOMAIN,
        _class: EntityClasses.DOMAIN,
        id: domain.id,
        name: domain.domain,
        displayName: domain.domain,
        domainName: domain.domain,
        registrar: domain.registrar,
        registeredDate: parseTimePropertyValue(domain.registered_date),
        expirationDate: parseTimePropertyValue(domain.expiration_date),
        nameservers: domain.nameservers,
        whoisOrganization: domain.whois_organization,
        subdomainsCount: domain.subdomains_count,
        firstSeen: parseTimePropertyValue(domain.first_seen),
        lastSeen: parseTimePropertyValue(domain.last_seen),
      },
    },
  });
}

export function createSubdomainEntity(subdomain: TenableEASMSubdomain): Entity {
  return createIntegrationEntity({
    entityData: {
      source: subdomain,
      assign: {
        _key: `tenable_easm_subdomain:${subdomain.id}`,
        _type: TENABLE_EASM_SUBDOMAIN,
        _class: EntityClasses.DOMAIN,
        id: subdomain.id,
        name: subdomain.subdomain,
        displayName: subdomain.subdomain,
        domainName: subdomain.subdomain,
        parentDomain: subdomain.parent_domain,
        ipAddresses: subdomain.ip_addresses,
        cname: subdomain.cname,
        status: subdomain.status,
        active: subdomain.status === 'active',
        firstSeen: parseTimePropertyValue(subdomain.first_seen),
        lastSeen: parseTimePropertyValue(subdomain.last_seen),
      },
    },
  });
}

export function createIpAddressEntity(ip: TenableEASMIpAddress): Entity {
  return createIntegrationEntity({
    entityData: {
      source: ip,
      assign: {
        _key: `tenable_easm_ip:${ip.id}`,
        _type: TENABLE_EASM_IP,
        _class: EntityClasses.IPADDRESS,
        id: ip.id,
        name: ip.ip,
        displayName: ip.ip,
        ipAddress: ip.ip,
        ipVersion: ip.version,
        asn: ip.asn,
        asnName: ip.asn_name,
        country: ip.country,
        city: ip.city,
        isp: ip.isp,
        cloudProvider: ip.cloud_provider,
        public: true,
        firstSeen: parseTimePropertyValue(ip.first_seen),
        lastSeen: parseTimePropertyValue(ip.last_seen),
      },
    },
  });
}

export function createPortEntity(ipId: string, port: TenableEASMPort): Entity {
  return createIntegrationEntity({
    entityData: {
      source: port,
      assign: {
        _key: `tenable_easm_port:${port.id}`,
        _type: TENABLE_EASM_PORT,
        _class: EntityClasses.PORT,
        id: port.id,
        name: `${port.protocol}/${port.port}`,
        displayName: `Port ${port.port}/${port.protocol}`,
        port: port.port,
        protocol: port.protocol,
        state: port.state,
        open: port.state === 'open',
        firstSeen: parseTimePropertyValue(port.first_seen),
        lastSeen: parseTimePropertyValue(port.last_seen),
      },
    },
  });
}

export function createServiceEntity(service: TenableEASMService): Entity {
  return createIntegrationEntity({
    entityData: {
      source: service,
      assign: {
        _key: `tenable_easm_service:${service.id}`,
        _type: TENABLE_EASM_SERVICE,
        _class: EntityClasses.SERVICE,
        id: service.id,
        name: service.name,
        displayName: `${service.name} ${service.version || ''}`.trim(),
        product: service.product,
        version: service.version,
        cpe: service.cpe,
        banner: service.banner,
        encrypted: service.is_encrypted,
      },
    },
  });
}

export function createCertificateEntity(cert: TenableEASMCertificate): Entity {
  return createIntegrationEntity({
    entityData: {
      source: cert,
      assign: {
        _key: `tenable_easm_certificate:${cert.id}`,
        _type: TENABLE_EASM_CERTIFICATE,
        _class: EntityClasses.CERTIFICATE,
        id: cert.id,
        name: cert.subject.common_name,
        displayName: cert.subject.common_name,
        serialNumber: cert.serial_number,
        subjectCommonName: cert.subject.common_name,
        subjectOrganization: cert.subject.organization,
        issuerCommonName: cert.issuer.common_name,
        issuerOrganization: cert.issuer.organization,
        validFrom: parseTimePropertyValue(cert.validity.not_before),
        validTo: parseTimePropertyValue(cert.validity.not_after),
        fingerprintSha256: cert.fingerprint_sha256,
        keyAlgorithm: cert.key_algorithm,
        keySize: cert.key_size,
        signatureAlgorithm: cert.signature_algorithm,
        selfSigned: cert.is_self_signed,
        expired: cert.is_expired,
        wildcard: cert.is_wildcard,
        subjectAlternativeNames: cert.sans,
      },
    },
  });
}

export function createVulnerabilityEntity(vuln: TenableEASMVulnerability): Entity {
  const severityToNumeric: Record<string, number> = {
    critical: 10,
    high: 8,
    medium: 5,
    low: 3,
    info: 1,
  };

  return createIntegrationEntity({
    entityData: {
      source: vuln,
      assign: {
        _key: `tenable_easm_vulnerability:${vuln.id}`,
        _type: TENABLE_EASM_VULNERABILITY,
        _class: EntityClasses.VULNERABILITY,
        id: vuln.id,
        name: vuln.cve_ids?.[0] || vuln.name,
        displayName: vuln.name,
        description: vuln.description,
        severity: vuln.severity,
        numericSeverity: severityToNumeric[vuln.severity] || 5,
        cvssScore: vuln.cvss_score,
        cvssVector: vuln.cvss_vector,
        cveIds: vuln.cve_ids,
        cweIds: vuln.cwe_ids,
        affectedAssets: vuln.affected_assets,
        remediation: vuln.remediation,
        references: vuln.references,
        discoveredOn: parseTimePropertyValue(vuln.discovered_at),
        state: vuln.state,
        open: vuln.state === 'open',
        pluginId: vuln.plugin_id,
        category: 'external-attack-surface',
        webLink: vuln.cve_ids?.[0]
          ? `https://nvd.nist.gov/vuln/detail/${vuln.cve_ids[0]}`
          : undefined,
      },
    },
  });
}

export function createTechnologyEntity(tech: TenableEASMTechnology): Entity {
  return createIntegrationEntity({
    entityData: {
      source: tech,
      assign: {
        _key: `tenable_easm_technology:${tech.id}`,
        _type: TENABLE_EASM_TECHNOLOGY,
        _class: EntityClasses.COMPONENT,
        id: tech.id,
        name: tech.name,
        displayName: `${tech.name} ${tech.version || ''}`.trim(),
        version: tech.version,
        category: tech.category,
        confidence: tech.confidence,
      },
    },
  });
}

export function createWebAppEntity(webapp: TenableEASMWebApplication): Entity {
  return createIntegrationEntity({
    entityData: {
      source: webapp,
      assign: {
        _key: `tenable_easm_web_app:${webapp.id}`,
        _type: TENABLE_EASM_WEB_APP,
        _class: EntityClasses.APPLICATION,
        id: webapp.id,
        name: webapp.hostname,
        displayName: webapp.title || webapp.url,
        url: webapp.url,
        hostname: webapp.hostname,
        path: webapp.path,
        statusCode: webapp.status_code,
        title: webapp.title,
        formsCount: webapp.forms,
        linksCount: webapp.links,
        scriptsCount: webapp.scripts,
        firstSeen: parseTimePropertyValue(webapp.first_seen),
        lastSeen: parseTimePropertyValue(webapp.last_seen),
      },
    },
  });
}
