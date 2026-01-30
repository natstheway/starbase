/**
 * CTM360 Entity Converters
 * Convert CTM360 API responses to JupiterOne entities
 */

import {
  createIntegrationEntity,
  Entity,
  parseTimePropertyValue,
} from '@jupiterone/integration-sdk-core';

import {
  CTM360_ACCOUNT,
  CTM360_ORGANIZATION,
  CTM360_DOMAIN,
  CTM360_SUBDOMAIN,
  CTM360_IP_ADDRESS,
  CTM360_SERVICE,
  CTM360_VULNERABILITY,
  CTM360_THREAT,
  CTM360_EXPOSURE,
  CTM360_LEAK,
  CTM360_BRAND_ABUSE,
  CTM360_CERTIFICATE,
  EntityClasses,
  CTM360Organization,
  CTM360Domain,
  CTM360Subdomain,
  CTM360IpAddress,
  CTM360Service,
  CTM360Vulnerability,
  CTM360Threat,
  CTM360Exposure,
  CTM360DataLeak,
  CTM360BrandAbuse,
} from '../types';

export function createAccountEntity(apiKey: string): Entity {
  return createIntegrationEntity({
    entityData: {
      source: { apiKey: '***' },
      assign: {
        _key: `ctm360_account:${apiKey.substring(0, 8)}`,
        _type: CTM360_ACCOUNT,
        _class: EntityClasses.ACCOUNT,
        name: 'CTM360 Account',
        displayName: 'CTM360 Account',
        vendor: 'CTM360',
        product: 'External Attack Surface Management',
      },
    },
  });
}

export function createOrganizationEntity(org: CTM360Organization): Entity {
  return createIntegrationEntity({
    entityData: {
      source: org,
      assign: {
        _key: `ctm360_organization:${org.id}`,
        _type: CTM360_ORGANIZATION,
        _class: EntityClasses.ORGANIZATION,
        id: org.id,
        name: org.name,
        displayName: org.name,
        industry: org.industry,
        country: org.country,
        domains: org.domains,
        createdOn: parseTimePropertyValue(org.created_at),
        updatedOn: parseTimePropertyValue(org.updated_at),
      },
    },
  });
}

export function createDomainEntity(domain: CTM360Domain): Entity {
  return createIntegrationEntity({
    entityData: {
      source: domain,
      assign: {
        _key: `ctm360_domain:${domain.id}`,
        _type: CTM360_DOMAIN,
        _class: EntityClasses.DOMAIN,
        id: domain.id,
        name: domain.domain,
        displayName: domain.domain,
        domainName: domain.domain,
        isPrimary: domain.is_primary,
        subdomainsCount: domain.subdomains_count,
        vulnerabilitiesCount: domain.vulnerabilities_count,
        status: domain.status,
        active: domain.status === 'active',
        firstSeen: parseTimePropertyValue(domain.first_seen),
        lastSeen: parseTimePropertyValue(domain.last_seen),
      },
    },
  });
}

export function createSubdomainEntity(subdomain: CTM360Subdomain): Entity {
  return createIntegrationEntity({
    entityData: {
      source: subdomain,
      assign: {
        _key: `ctm360_subdomain:${subdomain.id}`,
        _type: CTM360_SUBDOMAIN,
        _class: EntityClasses.DOMAIN,
        id: subdomain.id,
        name: subdomain.subdomain,
        displayName: subdomain.subdomain,
        domainName: subdomain.subdomain,
        ipAddresses: subdomain.ip_addresses,
        technologies: subdomain.technologies,
        ports: subdomain.ports,
        status: subdomain.status,
        active: subdomain.status === 'active',
        firstSeen: parseTimePropertyValue(subdomain.first_seen),
        lastSeen: parseTimePropertyValue(subdomain.last_seen),
      },
    },
  });
}

export function createIpAddressEntity(ip: CTM360IpAddress): Entity {
  return createIntegrationEntity({
    entityData: {
      source: ip,
      assign: {
        _key: `ctm360_ip:${ip.id}`,
        _type: CTM360_IP_ADDRESS,
        _class: EntityClasses.IPADDRESS,
        id: ip.id,
        name: ip.ip_address,
        displayName: ip.ip_address,
        ipAddress: ip.ip_address,
        ipVersion: ip.version,
        public: ip.is_public,
        country: ip.country,
        asn: ip.asn,
        organization: ip.organization,
        firstSeen: parseTimePropertyValue(ip.first_seen),
        lastSeen: parseTimePropertyValue(ip.last_seen),
      },
    },
  });
}

export function createServiceEntity(
  ipId: string,
  service: CTM360Service
): Entity {
  return createIntegrationEntity({
    entityData: {
      source: service,
      assign: {
        _key: `ctm360_service:${service.id}`,
        _type: CTM360_SERVICE,
        _class: EntityClasses.SERVICE,
        id: service.id,
        name: `${service.service_name}:${service.port}`,
        displayName: `${service.service_name} on port ${service.port}`,
        port: service.port,
        protocol: service.protocol,
        serviceName: service.service_name,
        product: service.product,
        version: service.version,
        banner: service.banner,
        encrypted: service.is_encrypted,
        vulnerabilities: service.vulnerabilities,
      },
    },
  });
}

export function createVulnerabilityEntity(vuln: CTM360Vulnerability): Entity {
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
        _key: `ctm360_vulnerability:${vuln.id}`,
        _type: CTM360_VULNERABILITY,
        _class: EntityClasses.VULNERABILITY,
        id: vuln.id,
        name: vuln.cve_id || vuln.title,
        displayName: vuln.title,
        description: vuln.description,
        severity: vuln.severity,
        numericSeverity: severityToNumeric[vuln.severity] || 5,
        cvssScore: vuln.cvss_score,
        cveId: vuln.cve_id,
        affectedAssets: vuln.affected_assets,
        remediation: vuln.remediation,
        references: vuln.references,
        discoveredOn: parseTimePropertyValue(vuln.discovered_at),
        status: vuln.status,
        open: vuln.status === 'open',
        category: 'external-attack-surface',
        webLink: vuln.cve_id
          ? `https://nvd.nist.gov/vuln/detail/${vuln.cve_id}`
          : undefined,
      },
    },
  });
}

export function createThreatEntity(threat: CTM360Threat): Entity {
  const severityToNumeric: Record<string, number> = {
    critical: 10,
    high: 8,
    medium: 5,
    low: 3,
  };

  return createIntegrationEntity({
    entityData: {
      source: threat,
      assign: {
        _key: `ctm360_threat:${threat.id}`,
        _type: CTM360_THREAT,
        _class: EntityClasses.THREAT,
        id: threat.id,
        name: threat.title,
        displayName: threat.title,
        description: threat.description,
        threatType: threat.type,
        severity: threat.severity,
        numericSeverity: severityToNumeric[threat.severity] || 5,
        source: threat.source,
        indicators: threat.indicators,
        firstSeen: parseTimePropertyValue(threat.first_seen),
        lastSeen: parseTimePropertyValue(threat.last_seen),
        status: threat.status,
        active: threat.status === 'active',
        category: 'threat-intelligence',
      },
    },
  });
}

export function createExposureEntity(exposure: CTM360Exposure): Entity {
  const severityToNumeric: Record<string, number> = {
    critical: 10,
    high: 8,
    medium: 5,
    low: 3,
  };

  return createIntegrationEntity({
    entityData: {
      source: exposure,
      assign: {
        _key: `ctm360_exposure:${exposure.id}`,
        _type: CTM360_EXPOSURE,
        _class: EntityClasses.RISK,
        id: exposure.id,
        name: exposure.title,
        displayName: exposure.title,
        description: exposure.description,
        exposureType: exposure.type,
        severity: exposure.severity,
        numericSeverity: severityToNumeric[exposure.severity] || 5,
        affectedAsset: exposure.affected_asset,
        remediation: exposure.remediation,
        discoveredOn: parseTimePropertyValue(exposure.discovered_at),
        status: exposure.status,
        open: exposure.status === 'open',
        category: 'external-exposure',
      },
    },
  });
}

export function createDataLeakEntity(leak: CTM360DataLeak): Entity {
  const severityToNumeric: Record<string, number> = {
    critical: 10,
    high: 8,
    medium: 5,
    low: 3,
  };

  return createIntegrationEntity({
    entityData: {
      source: leak,
      assign: {
        _key: `ctm360_data_leak:${leak.id}`,
        _type: CTM360_LEAK,
        _class: EntityClasses.RECORD,
        id: leak.id,
        name: `Data Leak from ${leak.source}`,
        displayName: `Data Leak - ${leak.source}`,
        source: leak.source,
        leakDate: parseTimePropertyValue(leak.leak_date),
        dataTypes: leak.data_types,
        affectedEmailsCount: leak.affected_emails_count,
        severity: leak.severity,
        numericSeverity: severityToNumeric[leak.severity] || 5,
        status: leak.status,
        category: 'data-leak',
      },
    },
  });
}

export function createBrandAbuseEntity(abuse: CTM360BrandAbuse): Entity {
  const severityToNumeric: Record<string, number> = {
    critical: 10,
    high: 8,
    medium: 5,
    low: 3,
  };

  return createIntegrationEntity({
    entityData: {
      source: abuse,
      assign: {
        _key: `ctm360_brand_abuse:${abuse.id}`,
        _type: CTM360_BRAND_ABUSE,
        _class: EntityClasses.RECORD,
        id: abuse.id,
        name: abuse.title,
        displayName: abuse.title,
        abuseType: abuse.type,
        url: abuse.url,
        screenshotUrl: abuse.screenshot_url,
        severity: abuse.severity,
        numericSeverity: severityToNumeric[abuse.severity] || 5,
        discoveredOn: parseTimePropertyValue(abuse.discovered_at),
        status: abuse.status,
        active: abuse.status === 'active',
        category: 'brand-protection',
      },
    },
  });
}
