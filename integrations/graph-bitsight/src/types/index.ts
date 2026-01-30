/**
 * Bitsight Integration Types
 * Defines entity types and relationships for EASM data
 */

// Entity Types
export const BITSIGHT_ACCOUNT = 'bitsight_account';
export const BITSIGHT_COMPANY = 'bitsight_company';
export const BITSIGHT_ASSET = 'bitsight_asset';
export const BITSIGHT_FINDING = 'bitsight_finding';
export const BITSIGHT_VULNERABILITY = 'bitsight_vulnerability';
export const BITSIGHT_RATING = 'bitsight_rating';
export const BITSIGHT_RISK_VECTOR = 'bitsight_risk_vector';
export const BITSIGHT_DOMAIN = 'bitsight_domain';
export const BITSIGHT_IP_ADDRESS = 'bitsight_ip_address';
export const BITSIGHT_CERTIFICATE = 'bitsight_certificate';

// Entity Classes (following JupiterOne data model)
export const EntityClasses = {
  ACCOUNT: 'Account',
  ORGANIZATION: 'Organization',
  HOST: 'Host',
  FINDING: 'Finding',
  VULNERABILITY: 'Vulnerability',
  ASSESSMENT: 'Assessment',
  RISK: 'Risk',
  DOMAIN: 'Domain',
  IPADDRESS: 'IpAddress',
  CERTIFICATE: 'Certificate',
};

// Relationship Types
export const Relationships = {
  ACCOUNT_HAS_COMPANY: {
    _type: 'bitsight_account_has_company',
    sourceType: BITSIGHT_ACCOUNT,
    _class: 'HAS',
    targetType: BITSIGHT_COMPANY,
  },
  COMPANY_HAS_ASSET: {
    _type: 'bitsight_company_has_asset',
    sourceType: BITSIGHT_COMPANY,
    _class: 'HAS',
    targetType: BITSIGHT_ASSET,
  },
  COMPANY_HAS_RATING: {
    _type: 'bitsight_company_has_rating',
    sourceType: BITSIGHT_COMPANY,
    _class: 'HAS',
    targetType: BITSIGHT_RATING,
  },
  RATING_HAS_RISK_VECTOR: {
    _type: 'bitsight_rating_has_risk_vector',
    sourceType: BITSIGHT_RATING,
    _class: 'HAS',
    targetType: BITSIGHT_RISK_VECTOR,
  },
  ASSET_HAS_FINDING: {
    _type: 'bitsight_asset_has_finding',
    sourceType: BITSIGHT_ASSET,
    _class: 'HAS',
    targetType: BITSIGHT_FINDING,
  },
  ASSET_HAS_VULNERABILITY: {
    _type: 'bitsight_asset_has_vulnerability',
    sourceType: BITSIGHT_ASSET,
    _class: 'HAS',
    targetType: BITSIGHT_VULNERABILITY,
  },
  ASSET_HAS_DOMAIN: {
    _type: 'bitsight_asset_has_domain',
    sourceType: BITSIGHT_ASSET,
    _class: 'HAS',
    targetType: BITSIGHT_DOMAIN,
  },
  ASSET_HAS_IP: {
    _type: 'bitsight_asset_has_ip_address',
    sourceType: BITSIGHT_ASSET,
    _class: 'HAS',
    targetType: BITSIGHT_IP_ADDRESS,
  },
  ASSET_HAS_CERTIFICATE: {
    _type: 'bitsight_asset_has_certificate',
    sourceType: BITSIGHT_ASSET,
    _class: 'HAS',
    targetType: BITSIGHT_CERTIFICATE,
  },
  FINDING_IDENTIFIED_VULNERABILITY: {
    _type: 'bitsight_finding_identified_vulnerability',
    sourceType: BITSIGHT_FINDING,
    _class: 'IDENTIFIED',
    targetType: BITSIGHT_VULNERABILITY,
  },
};

// Bitsight API Response Types
export interface BitsightCompany {
  guid: string;
  name: string;
  shortname: string;
  network_size_v4: number;
  rating: number;
  rating_date: string;
  industry: string;
  industry_slug: string;
  sub_industry: string;
  sub_industry_slug: string;
  type: string;
  homepage: string;
  primary_domain: string;
  external_id?: string;
}

export interface BitsightRating {
  rating: number;
  rating_date: string;
  range: string;
  rating_color: string;
}

export interface BitsightRiskVector {
  name: string;
  slug: string;
  rating: number;
  percentile: number;
  grade: string;
  grade_color: string;
  category: string;
  order: number;
}

export interface BitsightFinding {
  temporary_id: string;
  affects_rating: boolean;
  assets: BitsightAsset[];
  details: Record<string, unknown>;
  evidence_key: string;
  first_seen: string;
  last_seen: string;
  related_findings: string[];
  remediation_history: {
    last_requested_refresh_date: string | null;
    last_refresh_status_date: string | null;
    last_refresh_status: string | null;
    last_refresh_reason: string | null;
    last_refresh_reason_code: string | null;
  };
  risk_category: string;
  risk_vector: string;
  risk_vector_label: string;
  rolledup_observation_id: string;
  severity: number;
  severity_category: string;
  tags: string[];
  comments: string | null;
  attributed_companies: Array<{
    guid: string;
    name: string;
  }>;
  duration: string;
  remaining_decay: number;
}

export interface BitsightAsset {
  asset: string;
  asset_type: string;
  category: string;
  combined_importance?: number;
  country?: string;
  hosted_by?: string;
  importance?: number;
  ip_address?: string;
  is_ip?: boolean;
  name?: string;
  origin_subsidiary_guid?: string;
  origin_subsidiary_name?: string;
}

export interface BitsightVulnerability {
  cve_id: string;
  severity: string;
  cvss_score?: number;
  description?: string;
  published_date?: string;
  affected_assets: string[];
}

export interface IntegrationConfig {
  apiKey: string;
  companyGuid?: string;
  includeSubsidiaries?: boolean;
  includeFindingsHistory?: boolean;
}
