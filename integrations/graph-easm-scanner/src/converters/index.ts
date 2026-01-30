/**
 * Generic EASM Scanner Entity Converters
 */

import {
  createIntegrationEntity,
  Entity,
  parseTimePropertyValue,
} from '@jupiterone/integration-sdk-core';

import {
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
  ScannerScanData,
  ScannerAssetData,
  ScannerDomainData,
  ScannerSubdomainData,
  ScannerIpData,
  ScannerPortData,
  ScannerVulnerabilityData,
  ScannerFindingData,
  ScannerCertificateData,
  ScannerTechnologyData,
} from '../types';

export function createAccountEntity(scannerName: string): Entity {
  return createIntegrationEntity({
    entityData: {
      source: { scannerName },
      assign: {
        _key: `easm_scanner_account:${scannerName}`,
        _type: EASM_SCANNER_ACCOUNT,
        _class: EntityClasses.ACCOUNT,
        name: `${scannerName} Account`,
        displayName: `EASM Scanner: ${scannerName}`,
        vendor: scannerName,
        product: 'External Attack Surface Scanner',
      },
    },
  });
}

export function createScanEntity(scan: ScannerScanData): Entity {
  return createIntegrationEntity({
    entityData: {
      source: scan,
      assign: {
        _key: `easm_scanner_scan:${scan.id}`,
        _type: EASM_SCANNER_SCAN,
        _class: EntityClasses.ASSESSMENT,
        id: scan.id,
        name: scan.name,
        displayName: scan.name,
        scannerName: scan.scanner_name,
        scannerVersion: scan.scanner_version,
        scanType: scan.scan_type,
        startedOn: parseTimePropertyValue(scan.started_at),
        completedOn: parseTimePropertyValue(scan.completed_at),
        status: scan.status,
        targetScope: scan.target_scope,
        ...scan.metadata,
      },
    },
  });
}

export function createAssetEntity(scanId: string, asset: ScannerAssetData): Entity {
  return createIntegrationEntity({
    entityData: {
      source: asset,
      assign: {
        _key: `easm_scanner_asset:${scanId}:${asset.id}`,
        _type: EASM_SCANNER_ASSET,
        _class: EntityClasses.HOST,
        id: asset.id,
        name: asset.name || asset.value,
        displayName: asset.name || asset.value,
        assetType: asset.type,
        value: asset.value,
        confidence: asset.confidence,
        source: asset.source,
        tags: asset.tags,
        firstSeen: parseTimePropertyValue(asset.first_seen),
        lastSeen: parseTimePropertyValue(asset.last_seen),
        ...asset.metadata,
      },
    },
  });
}

export function createDomainEntity(scanId: string, domain: ScannerDomainData): Entity {
  const domainId = domain.id || domain.domain;

  return createIntegrationEntity({
    entityData: {
      source: domain,
      assign: {
        _key: `easm_scanner_domain:${scanId}:${domainId}`,
        _type: EASM_SCANNER_DOMAIN,
        _class: EntityClasses.DOMAIN,
        id: domainId,
        name: domain.domain,
        displayName: domain.domain,
        domainName: domain.domain,
        registrar: domain.registrar,
        registeredDate: parseTimePropertyValue(domain.registered_date),
        expirationDate: parseTimePropertyValue(domain.expiration_date),
        nameservers: domain.nameservers,
        whoisOrganization: domain.whois_organization,
        firstSeen: parseTimePropertyValue(domain.first_seen),
        lastSeen: parseTimePropertyValue(domain.last_seen),
        ...domain.metadata,
      },
    },
  });
}

export function createSubdomainEntity(scanId: string, subdomain: ScannerSubdomainData): Entity {
  const subdomainId = subdomain.id || subdomain.subdomain;

  return createIntegrationEntity({
    entityData: {
      source: subdomain,
      assign: {
        _key: `easm_scanner_subdomain:${scanId}:${subdomainId}`,
        _type: EASM_SCANNER_SUBDOMAIN,
        _class: EntityClasses.DOMAIN,
        id: subdomainId,
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
        ...subdomain.metadata,
      },
    },
  });
}

export function createIpAddressEntity(scanId: string, ip: ScannerIpData): Entity {
  const ipId = ip.id || ip.ip_address;

  return createIntegrationEntity({
    entityData: {
      source: ip,
      assign: {
        _key: `easm_scanner_ip:${scanId}:${ipId}`,
        _type: EASM_SCANNER_IP,
        _class: EntityClasses.IPADDRESS,
        id: ipId,
        name: ip.ip_address,
        displayName: ip.hostname || ip.ip_address,
        ipAddress: ip.ip_address,
        ipVersion: ip.version,
        hostname: ip.hostname,
        asn: ip.asn,
        asnName: ip.asn_name,
        country: ip.country,
        city: ip.city,
        isp: ip.isp,
        cloudProvider: ip.cloud_provider,
        public: ip.is_public ?? true,
        firstSeen: parseTimePropertyValue(ip.first_seen),
        lastSeen: parseTimePropertyValue(ip.last_seen),
        ...ip.metadata,
      },
    },
  });
}

export function createPortEntity(scanId: string, port: ScannerPortData): Entity {
  const portId = port.id || `${port.ip_address}:${port.port}:${port.protocol}`;

  return createIntegrationEntity({
    entityData: {
      source: port,
      assign: {
        _key: `easm_scanner_port:${scanId}:${portId}`,
        _type: EASM_SCANNER_PORT,
        _class: EntityClasses.PORT,
        id: portId,
        name: `${port.protocol}/${port.port}`,
        displayName: `${port.ip_address}:${port.port}/${port.protocol}`,
        port: port.port,
        protocol: port.protocol,
        state: port.state,
        open: port.state === 'open',
        serviceName: port.service_name,
        serviceProduct: port.service_product,
        serviceVersion: port.service_version,
        banner: port.banner,
        firstSeen: parseTimePropertyValue(port.first_seen),
        lastSeen: parseTimePropertyValue(port.last_seen),
        ...port.metadata,
      },
    },
  });
}

export function createServiceEntity(scanId: string, port: ScannerPortData): Entity {
  const serviceId = `${port.ip_address}:${port.port}:${port.service_name}`;

  return createIntegrationEntity({
    entityData: {
      source: port,
      assign: {
        _key: `easm_scanner_service:${scanId}:${serviceId}`,
        _type: EASM_SCANNER_SERVICE,
        _class: EntityClasses.SERVICE,
        id: serviceId,
        name: port.service_name || `Unknown Service on ${port.port}`,
        displayName: `${port.service_name || 'Service'} ${port.service_version || ''}`.trim(),
        product: port.service_product,
        version: port.service_version,
        banner: port.banner,
        port: port.port,
        protocol: port.protocol,
      },
    },
  });
}

export function createVulnerabilityEntity(scanId: string, vuln: ScannerVulnerabilityData): Entity {
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
        _key: `easm_scanner_vulnerability:${scanId}:${vuln.id}`,
        _type: EASM_SCANNER_VULNERABILITY,
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
        open: vuln.state === 'open' || vuln.state === undefined,
        pluginId: vuln.plugin_id,
        scannerSeverity: vuln.scanner_severity,
        category: 'external-attack-surface',
        webLink: vuln.cve_ids?.[0]
          ? `https://nvd.nist.gov/vuln/detail/${vuln.cve_ids[0]}`
          : undefined,
        ...vuln.metadata,
      },
    },
  });
}

export function createFindingEntity(scanId: string, finding: ScannerFindingData): Entity {
  const severityToNumeric: Record<string, number> = {
    critical: 10,
    high: 8,
    medium: 5,
    low: 3,
    info: 1,
  };

  return createIntegrationEntity({
    entityData: {
      source: finding,
      assign: {
        _key: `easm_scanner_finding:${scanId}:${finding.id}`,
        _type: EASM_SCANNER_FINDING,
        _class: EntityClasses.FINDING,
        id: finding.id,
        name: finding.title,
        displayName: finding.title,
        description: finding.description,
        category: finding.category || 'external-attack-surface',
        severity: finding.severity,
        numericSeverity: severityToNumeric[finding.severity] || 5,
        affectedAsset: finding.affected_asset,
        evidence: finding.evidence,
        remediation: finding.remediation,
        references: finding.references,
        discoveredOn: parseTimePropertyValue(finding.discovered_at),
        state: finding.state,
        open: finding.state === 'open' || finding.state === undefined,
        ...finding.metadata,
      },
    },
  });
}

export function createCertificateEntity(scanId: string, cert: ScannerCertificateData): Entity {
  const certId = cert.id || cert.fingerprint_sha256 || cert.serial_number || cert.subject_cn;

  return createIntegrationEntity({
    entityData: {
      source: cert,
      assign: {
        _key: `easm_scanner_certificate:${scanId}:${certId}`,
        _type: EASM_SCANNER_CERTIFICATE,
        _class: EntityClasses.CERTIFICATE,
        id: certId,
        name: cert.subject_cn,
        displayName: cert.subject_cn,
        serialNumber: cert.serial_number,
        subjectCommonName: cert.subject_cn,
        subjectOrganization: cert.subject_org,
        issuerCommonName: cert.issuer_cn,
        issuerOrganization: cert.issuer_org,
        validFrom: parseTimePropertyValue(cert.valid_from),
        validTo: parseTimePropertyValue(cert.valid_to),
        fingerprintSha256: cert.fingerprint_sha256,
        keyAlgorithm: cert.key_algorithm,
        keySize: cert.key_size,
        selfSigned: cert.is_self_signed,
        expired: cert.is_expired,
        wildcard: cert.is_wildcard,
        subjectAlternativeNames: cert.sans,
        associatedHosts: cert.associated_hosts,
        ...cert.metadata,
      },
    },
  });
}

export function createTechnologyEntity(scanId: string, tech: ScannerTechnologyData): Entity {
  const techId = tech.id || `${tech.name}:${tech.version || 'unknown'}`;

  return createIntegrationEntity({
    entityData: {
      source: tech,
      assign: {
        _key: `easm_scanner_technology:${scanId}:${techId}`,
        _type: EASM_SCANNER_TECHNOLOGY,
        _class: EntityClasses.COMPONENT,
        id: techId,
        name: tech.name,
        displayName: `${tech.name} ${tech.version || ''}`.trim(),
        version: tech.version,
        category: tech.category,
        confidence: tech.confidence,
        detectedOn: tech.detected_on,
        ...tech.metadata,
      },
    },
  });
}
