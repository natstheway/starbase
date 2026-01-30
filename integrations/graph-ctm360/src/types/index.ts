/**
 * CTM360 Integration Types
 * Defines entity types and relationships for EASM/threat intelligence data
 */

// Entity Types
export const CTM360_ACCOUNT = 'ctm360_account';
export const CTM360_ORGANIZATION = 'ctm360_organization';
export const CTM360_ASSET = 'ctm360_asset';
export const CTM360_DOMAIN = 'ctm360_domain';
export const CTM360_SUBDOMAIN = 'ctm360_subdomain';
export const CTM360_IP_ADDRESS = 'ctm360_ip_address';
export const CTM360_SERVICE = 'ctm360_service';
export const CTM360_VULNERABILITY = 'ctm360_vulnerability';
export const CTM360_THREAT = 'ctm360_threat';
export const CTM360_EXPOSURE = 'ctm360_exposure';
export const CTM360_LEAK = 'ctm360_data_leak';
export const CTM360_BRAND_ABUSE = 'ctm360_brand_abuse';
export const CTM360_CERTIFICATE = 'ctm360_certificate';

// Entity Classes
export const EntityClasses = {
  ACCOUNT: 'Account',
  ORGANIZATION: 'Organization',
  HOST: 'Host',
  DOMAIN: 'Domain',
  IPADDRESS: 'IpAddress',
  SERVICE: 'Service',
  VULNERABILITY: 'Vulnerability',
  THREAT: 'Threat',
  RISK: 'Risk',
  RECORD: 'Record',
  CERTIFICATE: 'Certificate',
};

// Relationship Types
export const Relationships = {
  ACCOUNT_HAS_ORGANIZATION: {
    _type: 'ctm360_account_has_organization',
    sourceType: CTM360_ACCOUNT,
    _class: 'HAS',
    targetType: CTM360_ORGANIZATION,
  },
  ORGANIZATION_HAS_DOMAIN: {
    _type: 'ctm360_organization_has_domain',
    sourceType: CTM360_ORGANIZATION,
    _class: 'HAS',
    targetType: CTM360_DOMAIN,
  },
  DOMAIN_HAS_SUBDOMAIN: {
    _type: 'ctm360_domain_has_subdomain',
    sourceType: CTM360_DOMAIN,
    _class: 'HAS',
    targetType: CTM360_SUBDOMAIN,
  },
  DOMAIN_HAS_IP: {
    _type: 'ctm360_domain_has_ip_address',
    sourceType: CTM360_DOMAIN,
    _class: 'HAS',
    targetType: CTM360_IP_ADDRESS,
  },
  SUBDOMAIN_HAS_IP: {
    _type: 'ctm360_subdomain_has_ip_address',
    sourceType: CTM360_SUBDOMAIN,
    _class: 'HAS',
    targetType: CTM360_IP_ADDRESS,
  },
  IP_HAS_SERVICE: {
    _type: 'ctm360_ip_has_service',
    sourceType: CTM360_IP_ADDRESS,
    _class: 'HAS',
    targetType: CTM360_SERVICE,
  },
  ASSET_HAS_VULNERABILITY: {
    _type: 'ctm360_asset_has_vulnerability',
    sourceType: CTM360_ASSET,
    _class: 'HAS',
    targetType: CTM360_VULNERABILITY,
  },
  ORGANIZATION_HAS_THREAT: {
    _type: 'ctm360_organization_has_threat',
    sourceType: CTM360_ORGANIZATION,
    _class: 'HAS',
    targetType: CTM360_THREAT,
  },
  ORGANIZATION_HAS_EXPOSURE: {
    _type: 'ctm360_organization_has_exposure',
    sourceType: CTM360_ORGANIZATION,
    _class: 'HAS',
    targetType: CTM360_EXPOSURE,
  },
  ORGANIZATION_HAS_LEAK: {
    _type: 'ctm360_organization_has_data_leak',
    sourceType: CTM360_ORGANIZATION,
    _class: 'HAS',
    targetType: CTM360_LEAK,
  },
  ORGANIZATION_HAS_BRAND_ABUSE: {
    _type: 'ctm360_organization_has_brand_abuse',
    sourceType: CTM360_ORGANIZATION,
    _class: 'HAS',
    targetType: CTM360_BRAND_ABUSE,
  },
  DOMAIN_HAS_CERTIFICATE: {
    _type: 'ctm360_domain_has_certificate',
    sourceType: CTM360_DOMAIN,
    _class: 'HAS',
    targetType: CTM360_CERTIFICATE,
  },
};

// CTM360 API Response Types
export interface CTM360Organization {
  id: string;
  name: string;
  industry: string;
  country: string;
  domains: string[];
  created_at: string;
  updated_at: string;
}

export interface CTM360Domain {
  id: string;
  domain: string;
  organization_id: string;
  is_primary: boolean;
  dns_records: CTM360DnsRecord[];
  subdomains_count: number;
  vulnerabilities_count: number;
  status: 'active' | 'inactive' | 'unknown';
  first_seen: string;
  last_seen: string;
}

export interface CTM360DnsRecord {
  type: string;
  value: string;
  ttl: number;
}

export interface CTM360Subdomain {
  id: string;
  subdomain: string;
  domain_id: string;
  ip_addresses: string[];
  technologies: string[];
  ports: number[];
  status: 'active' | 'inactive';
  first_seen: string;
  last_seen: string;
}

export interface CTM360IpAddress {
  id: string;
  ip_address: string;
  version: 4 | 6;
  is_public: boolean;
  country: string;
  asn: string;
  organization: string;
  services: CTM360Service[];
  first_seen: string;
  last_seen: string;
}

export interface CTM360Service {
  id: string;
  port: number;
  protocol: string;
  service_name: string;
  product: string;
  version: string;
  banner: string;
  is_encrypted: boolean;
  vulnerabilities: string[];
}

export interface CTM360Vulnerability {
  id: string;
  cve_id?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss_score?: number;
  affected_assets: string[];
  remediation: string;
  references: string[];
  discovered_at: string;
  status: 'open' | 'resolved' | 'false_positive';
}

export interface CTM360Threat {
  id: string;
  type: 'phishing' | 'malware' | 'c2' | 'lookalike' | 'dark_web_mention' | 'other';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  indicators: string[];
  first_seen: string;
  last_seen: string;
  status: 'active' | 'mitigated' | 'monitoring';
}

export interface CTM360Exposure {
  id: string;
  type: 'open_port' | 'misconfiguration' | 'sensitive_data' | 'outdated_software' | 'weak_encryption';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affected_asset: string;
  remediation: string;
  discovered_at: string;
  status: 'open' | 'resolved';
}

export interface CTM360DataLeak {
  id: string;
  source: string;
  leak_date: string;
  data_types: string[];
  affected_emails_count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'reviewed' | 'mitigated';
}

export interface CTM360BrandAbuse {
  id: string;
  type: 'lookalike_domain' | 'social_media' | 'app_store' | 'other';
  title: string;
  url: string;
  screenshot_url?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  discovered_at: string;
  status: 'active' | 'taken_down' | 'monitoring';
}

export interface IntegrationConfig {
  apiKey: string;
  apiUrl?: string;
  tenantId?: string;
  includeThreats?: boolean;
  includeDataLeaks?: boolean;
  includeBrandAbuse?: boolean;
}
