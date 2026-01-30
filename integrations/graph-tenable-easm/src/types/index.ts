/**
 * Tenable EASM Integration Types
 * For Tenable Attack Surface Management (External Attack Surface)
 */

// Entity Types
export const TENABLE_EASM_ACCOUNT = 'tenable_easm_account';
export const TENABLE_EASM_INVENTORY = 'tenable_easm_inventory';
export const TENABLE_EASM_ASSET = 'tenable_easm_asset';
export const TENABLE_EASM_DOMAIN = 'tenable_easm_domain';
export const TENABLE_EASM_SUBDOMAIN = 'tenable_easm_subdomain';
export const TENABLE_EASM_IP = 'tenable_easm_ip_address';
export const TENABLE_EASM_PORT = 'tenable_easm_port';
export const TENABLE_EASM_SERVICE = 'tenable_easm_service';
export const TENABLE_EASM_CERTIFICATE = 'tenable_easm_certificate';
export const TENABLE_EASM_VULNERABILITY = 'tenable_easm_vulnerability';
export const TENABLE_EASM_TECHNOLOGY = 'tenable_easm_technology';
export const TENABLE_EASM_WEB_APP = 'tenable_easm_web_application';

// Entity Classes
export const EntityClasses = {
  ACCOUNT: 'Account',
  ASSESSMENT: 'Assessment',
  HOST: 'Host',
  DOMAIN: 'Domain',
  IPADDRESS: 'IpAddress',
  PORT: 'Port',
  SERVICE: 'Service',
  CERTIFICATE: 'Certificate',
  VULNERABILITY: 'Vulnerability',
  APPLICATION: 'Application',
  COMPONENT: 'Component',
};

// Relationship Types
export const Relationships = {
  ACCOUNT_HAS_INVENTORY: {
    _type: 'tenable_easm_account_has_inventory',
    sourceType: TENABLE_EASM_ACCOUNT,
    _class: 'HAS',
    targetType: TENABLE_EASM_INVENTORY,
  },
  INVENTORY_HAS_ASSET: {
    _type: 'tenable_easm_inventory_has_asset',
    sourceType: TENABLE_EASM_INVENTORY,
    _class: 'HAS',
    targetType: TENABLE_EASM_ASSET,
  },
  INVENTORY_HAS_DOMAIN: {
    _type: 'tenable_easm_inventory_has_domain',
    sourceType: TENABLE_EASM_INVENTORY,
    _class: 'HAS',
    targetType: TENABLE_EASM_DOMAIN,
  },
  DOMAIN_HAS_SUBDOMAIN: {
    _type: 'tenable_easm_domain_has_subdomain',
    sourceType: TENABLE_EASM_DOMAIN,
    _class: 'HAS',
    targetType: TENABLE_EASM_SUBDOMAIN,
  },
  ASSET_HAS_IP: {
    _type: 'tenable_easm_asset_has_ip',
    sourceType: TENABLE_EASM_ASSET,
    _class: 'HAS',
    targetType: TENABLE_EASM_IP,
  },
  IP_HAS_PORT: {
    _type: 'tenable_easm_ip_has_port',
    sourceType: TENABLE_EASM_IP,
    _class: 'HAS',
    targetType: TENABLE_EASM_PORT,
  },
  PORT_HAS_SERVICE: {
    _type: 'tenable_easm_port_has_service',
    sourceType: TENABLE_EASM_PORT,
    _class: 'HAS',
    targetType: TENABLE_EASM_SERVICE,
  },
  ASSET_HAS_CERTIFICATE: {
    _type: 'tenable_easm_asset_has_certificate',
    sourceType: TENABLE_EASM_ASSET,
    _class: 'HAS',
    targetType: TENABLE_EASM_CERTIFICATE,
  },
  ASSET_HAS_VULNERABILITY: {
    _type: 'tenable_easm_asset_has_vulnerability',
    sourceType: TENABLE_EASM_ASSET,
    _class: 'HAS',
    targetType: TENABLE_EASM_VULNERABILITY,
  },
  SERVICE_USES_TECHNOLOGY: {
    _type: 'tenable_easm_service_uses_technology',
    sourceType: TENABLE_EASM_SERVICE,
    _class: 'USES',
    targetType: TENABLE_EASM_TECHNOLOGY,
  },
  ASSET_HAS_WEB_APP: {
    _type: 'tenable_easm_asset_has_web_application',
    sourceType: TENABLE_EASM_ASSET,
    _class: 'HAS',
    targetType: TENABLE_EASM_WEB_APP,
  },
};

// Tenable EASM API Types
export interface TenableEASMInventory {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  asset_count: number;
  domain_count: number;
  ip_count: number;
}

export interface TenableEASMAsset {
  id: string;
  type: 'domain' | 'ip' | 'subdomain' | 'certificate' | 'service';
  value: string;
  inventory_id: string;
  first_seen: string;
  last_seen: string;
  confidence: number;
  attribution: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface TenableEASMDomain {
  id: string;
  domain: string;
  registrar: string;
  registered_date: string;
  expiration_date: string;
  nameservers: string[];
  whois_organization: string;
  dns_records: TenableEASMDnsRecord[];
  subdomains_count: number;
  first_seen: string;
  last_seen: string;
}

export interface TenableEASMDnsRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
}

export interface TenableEASMSubdomain {
  id: string;
  subdomain: string;
  parent_domain: string;
  ip_addresses: string[];
  cname: string;
  first_seen: string;
  last_seen: string;
  status: 'active' | 'inactive' | 'unknown';
}

export interface TenableEASMIpAddress {
  id: string;
  ip: string;
  version: 4 | 6;
  asn: string;
  asn_name: string;
  country: string;
  city: string;
  isp: string;
  cloud_provider: string;
  ports: TenableEASMPort[];
  first_seen: string;
  last_seen: string;
}

export interface TenableEASMPort {
  id: string;
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'filtered' | 'closed';
  service: TenableEASMService;
  first_seen: string;
  last_seen: string;
}

export interface TenableEASMService {
  id: string;
  name: string;
  product: string;
  version: string;
  cpe: string;
  banner: string;
  technologies: TenableEASMTechnology[];
  is_encrypted: boolean;
  certificate_id?: string;
}

export interface TenableEASMTechnology {
  id: string;
  name: string;
  version: string;
  category: string;
  confidence: number;
}

export interface TenableEASMCertificate {
  id: string;
  serial_number: string;
  subject: {
    common_name: string;
    organization: string;
    country: string;
  };
  issuer: {
    common_name: string;
    organization: string;
  };
  validity: {
    not_before: string;
    not_after: string;
  };
  fingerprint_sha256: string;
  key_algorithm: string;
  key_size: number;
  signature_algorithm: string;
  is_self_signed: boolean;
  is_expired: boolean;
  is_wildcard: boolean;
  sans: string[];
}

export interface TenableEASMVulnerability {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss_score: number;
  cvss_vector: string;
  cve_ids: string[];
  cwe_ids: string[];
  affected_assets: string[];
  remediation: string;
  references: string[];
  discovered_at: string;
  state: 'open' | 'fixed' | 'accepted';
  plugin_id?: string;
}

export interface TenableEASMWebApplication {
  id: string;
  url: string;
  hostname: string;
  path: string;
  technologies: TenableEASMTechnology[];
  headers: Record<string, string>;
  cookies: string[];
  forms: number;
  links: number;
  scripts: number;
  status_code: number;
  title: string;
  first_seen: string;
  last_seen: string;
}

export interface IntegrationConfig {
  accessKey: string;
  secretKey: string;
  region?: string;
  inventoryId?: string;
  includeTechnologies?: boolean;
  includeWebApps?: boolean;
}
