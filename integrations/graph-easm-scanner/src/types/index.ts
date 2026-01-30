/**
 * Generic EASM Scanner Integration Types
 * Flexible schema for importing data from custom scanners
 */

// Entity Types
export const EASM_SCANNER_ACCOUNT = 'easm_scanner_account';
export const EASM_SCANNER_SCAN = 'easm_scanner_scan';
export const EASM_SCANNER_ASSET = 'easm_scanner_asset';
export const EASM_SCANNER_DOMAIN = 'easm_scanner_domain';
export const EASM_SCANNER_SUBDOMAIN = 'easm_scanner_subdomain';
export const EASM_SCANNER_IP = 'easm_scanner_ip_address';
export const EASM_SCANNER_PORT = 'easm_scanner_port';
export const EASM_SCANNER_SERVICE = 'easm_scanner_service';
export const EASM_SCANNER_VULNERABILITY = 'easm_scanner_vulnerability';
export const EASM_SCANNER_FINDING = 'easm_scanner_finding';
export const EASM_SCANNER_CERTIFICATE = 'easm_scanner_certificate';
export const EASM_SCANNER_TECHNOLOGY = 'easm_scanner_technology';

// Entity Classes
export const EntityClasses = {
  ACCOUNT: 'Account',
  ASSESSMENT: 'Assessment',
  HOST: 'Host',
  DOMAIN: 'Domain',
  IPADDRESS: 'IpAddress',
  PORT: 'Port',
  SERVICE: 'Service',
  VULNERABILITY: 'Vulnerability',
  FINDING: 'Finding',
  CERTIFICATE: 'Certificate',
  COMPONENT: 'Component',
};

// Relationship Types
export const Relationships = {
  ACCOUNT_HAS_SCAN: {
    _type: 'easm_scanner_account_has_scan',
    sourceType: EASM_SCANNER_ACCOUNT,
    _class: 'HAS',
    targetType: EASM_SCANNER_SCAN,
  },
  SCAN_IDENTIFIED_ASSET: {
    _type: 'easm_scanner_scan_identified_asset',
    sourceType: EASM_SCANNER_SCAN,
    _class: 'IDENTIFIED',
    targetType: EASM_SCANNER_ASSET,
  },
  SCAN_IDENTIFIED_DOMAIN: {
    _type: 'easm_scanner_scan_identified_domain',
    sourceType: EASM_SCANNER_SCAN,
    _class: 'IDENTIFIED',
    targetType: EASM_SCANNER_DOMAIN,
  },
  DOMAIN_HAS_SUBDOMAIN: {
    _type: 'easm_scanner_domain_has_subdomain',
    sourceType: EASM_SCANNER_DOMAIN,
    _class: 'HAS',
    targetType: EASM_SCANNER_SUBDOMAIN,
  },
  ASSET_HAS_IP: {
    _type: 'easm_scanner_asset_has_ip',
    sourceType: EASM_SCANNER_ASSET,
    _class: 'HAS',
    targetType: EASM_SCANNER_IP,
  },
  IP_HAS_PORT: {
    _type: 'easm_scanner_ip_has_port',
    sourceType: EASM_SCANNER_IP,
    _class: 'HAS',
    targetType: EASM_SCANNER_PORT,
  },
  PORT_HAS_SERVICE: {
    _type: 'easm_scanner_port_has_service',
    sourceType: EASM_SCANNER_PORT,
    _class: 'HAS',
    targetType: EASM_SCANNER_SERVICE,
  },
  ASSET_HAS_VULNERABILITY: {
    _type: 'easm_scanner_asset_has_vulnerability',
    sourceType: EASM_SCANNER_ASSET,
    _class: 'HAS',
    targetType: EASM_SCANNER_VULNERABILITY,
  },
  SCAN_IDENTIFIED_VULNERABILITY: {
    _type: 'easm_scanner_scan_identified_vulnerability',
    sourceType: EASM_SCANNER_SCAN,
    _class: 'IDENTIFIED',
    targetType: EASM_SCANNER_VULNERABILITY,
  },
  SCAN_IDENTIFIED_FINDING: {
    _type: 'easm_scanner_scan_identified_finding',
    sourceType: EASM_SCANNER_SCAN,
    _class: 'IDENTIFIED',
    targetType: EASM_SCANNER_FINDING,
  },
  ASSET_HAS_CERTIFICATE: {
    _type: 'easm_scanner_asset_has_certificate',
    sourceType: EASM_SCANNER_ASSET,
    _class: 'HAS',
    targetType: EASM_SCANNER_CERTIFICATE,
  },
  SERVICE_USES_TECHNOLOGY: {
    _type: 'easm_scanner_service_uses_technology',
    sourceType: EASM_SCANNER_SERVICE,
    _class: 'USES',
    targetType: EASM_SCANNER_TECHNOLOGY,
  },
};

// Generic input data types (flexible schema for custom scanners)
export interface ScannerScanData {
  id: string;
  name: string;
  scanner_name: string;
  scanner_version?: string;
  scan_type?: string;
  started_at?: string;
  completed_at?: string;
  status?: 'completed' | 'running' | 'failed' | 'cancelled';
  target_scope?: string[];
  metadata?: Record<string, unknown>;
}

export interface ScannerAssetData {
  id: string;
  type: 'domain' | 'ip' | 'subdomain' | 'host' | 'service' | 'url' | 'other';
  value: string;
  name?: string;
  first_seen?: string;
  last_seen?: string;
  confidence?: number;
  source?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ScannerDomainData {
  id?: string;
  domain: string;
  registrar?: string;
  registered_date?: string;
  expiration_date?: string;
  nameservers?: string[];
  whois_organization?: string;
  dns_records?: Array<{ type: string; value: string; ttl?: number }>;
  first_seen?: string;
  last_seen?: string;
  metadata?: Record<string, unknown>;
}

export interface ScannerSubdomainData {
  id?: string;
  subdomain: string;
  parent_domain: string;
  ip_addresses?: string[];
  cname?: string;
  status?: 'active' | 'inactive' | 'unknown';
  first_seen?: string;
  last_seen?: string;
  metadata?: Record<string, unknown>;
}

export interface ScannerIpData {
  id?: string;
  ip_address: string;
  version?: 4 | 6;
  hostname?: string;
  asn?: string;
  asn_name?: string;
  country?: string;
  city?: string;
  isp?: string;
  cloud_provider?: string;
  is_public?: boolean;
  first_seen?: string;
  last_seen?: string;
  metadata?: Record<string, unknown>;
}

export interface ScannerPortData {
  id?: string;
  ip_address: string;
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'filtered' | 'closed';
  service_name?: string;
  service_product?: string;
  service_version?: string;
  banner?: string;
  first_seen?: string;
  last_seen?: string;
  metadata?: Record<string, unknown>;
}

export interface ScannerVulnerabilityData {
  id: string;
  name: string;
  description?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss_score?: number;
  cvss_vector?: string;
  cve_ids?: string[];
  cwe_ids?: string[];
  affected_assets?: string[];
  remediation?: string;
  references?: string[];
  discovered_at?: string;
  state?: 'open' | 'fixed' | 'accepted' | 'false_positive';
  plugin_id?: string;
  scanner_severity?: string;
  metadata?: Record<string, unknown>;
}

export interface ScannerFindingData {
  id: string;
  title: string;
  description?: string;
  category?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  affected_asset?: string;
  evidence?: string;
  remediation?: string;
  references?: string[];
  discovered_at?: string;
  state?: 'open' | 'resolved' | 'accepted';
  metadata?: Record<string, unknown>;
}

export interface ScannerCertificateData {
  id?: string;
  serial_number?: string;
  subject_cn: string;
  subject_org?: string;
  issuer_cn?: string;
  issuer_org?: string;
  valid_from?: string;
  valid_to?: string;
  fingerprint_sha256?: string;
  key_algorithm?: string;
  key_size?: number;
  is_self_signed?: boolean;
  is_expired?: boolean;
  is_wildcard?: boolean;
  sans?: string[];
  associated_hosts?: string[];
  metadata?: Record<string, unknown>;
}

export interface ScannerTechnologyData {
  id?: string;
  name: string;
  version?: string;
  category?: string;
  confidence?: number;
  detected_on?: string[];
  metadata?: Record<string, unknown>;
}

// Full scan report structure
export interface ScannerReport {
  scan: ScannerScanData;
  assets?: ScannerAssetData[];
  domains?: ScannerDomainData[];
  subdomains?: ScannerSubdomainData[];
  ip_addresses?: ScannerIpData[];
  ports?: ScannerPortData[];
  vulnerabilities?: ScannerVulnerabilityData[];
  findings?: ScannerFindingData[];
  certificates?: ScannerCertificateData[];
  technologies?: ScannerTechnologyData[];
}

export interface IntegrationConfig {
  scannerName: string;
  dataSourceType: 'file' | 'api';
  dataFilePath?: string;
  apiUrl?: string;
  apiKey?: string;
  apiAuthHeader?: string;
}
