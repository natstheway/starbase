/**
 * Bitsight Entity Converters
 * Convert Bitsight API responses to JupiterOne entities
 */

import {
  createIntegrationEntity,
  Entity,
  parseTimePropertyValue,
} from '@jupiterone/integration-sdk-core';

import {
  BITSIGHT_ACCOUNT,
  BITSIGHT_COMPANY,
  BITSIGHT_ASSET,
  BITSIGHT_FINDING,
  BITSIGHT_VULNERABILITY,
  BITSIGHT_RATING,
  BITSIGHT_RISK_VECTOR,
  BITSIGHT_DOMAIN,
  BITSIGHT_IP_ADDRESS,
  BITSIGHT_CERTIFICATE,
  EntityClasses,
  BitsightCompany,
  BitsightRating,
  BitsightRiskVector,
  BitsightFinding,
  BitsightAsset,
  BitsightVulnerability,
} from '../types';

export function createAccountEntity(apiKey: string): Entity {
  return createIntegrationEntity({
    entityData: {
      source: { apiKey: '***' },
      assign: {
        _key: `bitsight_account:${apiKey.substring(0, 8)}`,
        _type: BITSIGHT_ACCOUNT,
        _class: EntityClasses.ACCOUNT,
        name: 'Bitsight Account',
        displayName: 'Bitsight Account',
        vendor: 'Bitsight',
        product: 'Security Ratings',
      },
    },
  });
}

export function createCompanyEntity(company: BitsightCompany): Entity {
  return createIntegrationEntity({
    entityData: {
      source: company,
      assign: {
        _key: `bitsight_company:${company.guid}`,
        _type: BITSIGHT_COMPANY,
        _class: EntityClasses.ORGANIZATION,
        id: company.guid,
        name: company.name,
        displayName: company.name,
        shortname: company.shortname,
        networkSize: company.network_size_v4,
        rating: company.rating,
        ratingDate: parseTimePropertyValue(company.rating_date),
        industry: company.industry,
        industrySlug: company.industry_slug,
        subIndustry: company.sub_industry,
        subIndustrySlug: company.sub_industry_slug,
        type: company.type,
        homepage: company.homepage,
        primaryDomain: company.primary_domain,
        externalId: company.external_id,
      },
    },
  });
}

export function createRatingEntity(
  companyGuid: string,
  rating: BitsightRating
): Entity {
  return createIntegrationEntity({
    entityData: {
      source: rating,
      assign: {
        _key: `bitsight_rating:${companyGuid}:${rating.rating_date}`,
        _type: BITSIGHT_RATING,
        _class: EntityClasses.ASSESSMENT,
        name: `Rating ${rating.rating}`,
        displayName: `Bitsight Rating: ${rating.rating}`,
        rating: rating.rating,
        ratingDate: parseTimePropertyValue(rating.rating_date),
        range: rating.range,
        ratingColor: rating.rating_color,
        category: rating.range === 'Advanced' ? 'excellent' :
                  rating.range === 'Basic' ? 'fair' : 'basic',
      },
    },
  });
}

export function createRiskVectorEntity(
  companyGuid: string,
  riskVector: BitsightRiskVector
): Entity {
  return createIntegrationEntity({
    entityData: {
      source: riskVector,
      assign: {
        _key: `bitsight_risk_vector:${companyGuid}:${riskVector.slug}`,
        _type: BITSIGHT_RISK_VECTOR,
        _class: EntityClasses.RISK,
        name: riskVector.name,
        displayName: riskVector.name,
        slug: riskVector.slug,
        rating: riskVector.rating,
        percentile: riskVector.percentile,
        grade: riskVector.grade,
        gradeColor: riskVector.grade_color,
        category: riskVector.category,
        order: riskVector.order,
        severity: riskVector.rating < 500 ? 'critical' :
                  riskVector.rating < 640 ? 'high' :
                  riskVector.rating < 740 ? 'medium' : 'low',
      },
    },
  });
}

export function createAssetEntity(
  companyGuid: string,
  asset: BitsightAsset
): Entity {
  const assetKey = asset.ip_address || asset.asset || asset.name || 'unknown';

  return createIntegrationEntity({
    entityData: {
      source: asset,
      assign: {
        _key: `bitsight_asset:${companyGuid}:${assetKey}`,
        _type: BITSIGHT_ASSET,
        _class: EntityClasses.HOST,
        name: asset.name || asset.asset,
        displayName: asset.name || asset.asset,
        asset: asset.asset,
        assetType: asset.asset_type,
        category: asset.category,
        combinedImportance: asset.combined_importance,
        country: asset.country,
        hostedBy: asset.hosted_by,
        importance: asset.importance,
        ipAddress: asset.ip_address,
        isIp: asset.is_ip,
        originSubsidiaryGuid: asset.origin_subsidiary_guid,
        originSubsidiaryName: asset.origin_subsidiary_name,
      },
    },
  });
}

export function createFindingEntity(
  companyGuid: string,
  finding: BitsightFinding
): Entity {
  return createIntegrationEntity({
    entityData: {
      source: finding,
      assign: {
        _key: `bitsight_finding:${companyGuid}:${finding.temporary_id}`,
        _type: BITSIGHT_FINDING,
        _class: EntityClasses.FINDING,
        id: finding.temporary_id,
        name: `${finding.risk_vector_label} Finding`,
        displayName: `${finding.risk_vector_label} - ${finding.severity_category}`,
        category: 'external-attack-surface',
        affectsRating: finding.affects_rating,
        evidenceKey: finding.evidence_key,
        firstSeen: parseTimePropertyValue(finding.first_seen),
        lastSeen: parseTimePropertyValue(finding.last_seen),
        riskCategory: finding.risk_category,
        riskVector: finding.risk_vector,
        riskVectorLabel: finding.risk_vector_label,
        severity: finding.severity,
        severityCategory: finding.severity_category,
        numericSeverity: finding.severity,
        open: true,
        tags: finding.tags,
        duration: finding.duration,
        remainingDecay: finding.remaining_decay,
      },
    },
  });
}

export function createVulnerabilityEntity(
  vuln: BitsightVulnerability
): Entity {
  return createIntegrationEntity({
    entityData: {
      source: vuln,
      assign: {
        _key: `bitsight_vulnerability:${vuln.cve_id}`,
        _type: BITSIGHT_VULNERABILITY,
        _class: EntityClasses.VULNERABILITY,
        id: vuln.cve_id,
        name: vuln.cve_id,
        displayName: vuln.cve_id,
        severity: vuln.severity,
        cvssScore: vuln.cvss_score,
        description: vuln.description,
        publishedDate: parseTimePropertyValue(vuln.published_date),
        category: 'application',
        public: true,
        webLink: `https://nvd.nist.gov/vuln/detail/${vuln.cve_id}`,
      },
    },
  });
}

export function createDomainEntity(
  companyGuid: string,
  domain: string
): Entity {
  return createIntegrationEntity({
    entityData: {
      source: { domain },
      assign: {
        _key: `bitsight_domain:${companyGuid}:${domain}`,
        _type: BITSIGHT_DOMAIN,
        _class: EntityClasses.DOMAIN,
        name: domain,
        displayName: domain,
        domainName: domain,
      },
    },
  });
}

export function createIpAddressEntity(
  companyGuid: string,
  ipAddress: string,
  metadata?: { country?: string; hostedBy?: string }
): Entity {
  return createIntegrationEntity({
    entityData: {
      source: { ipAddress, ...metadata },
      assign: {
        _key: `bitsight_ip:${companyGuid}:${ipAddress}`,
        _type: BITSIGHT_IP_ADDRESS,
        _class: EntityClasses.IPADDRESS,
        name: ipAddress,
        displayName: ipAddress,
        ipAddress: ipAddress,
        country: metadata?.country,
        hostedBy: metadata?.hostedBy,
        public: true,
      },
    },
  });
}

export function createCertificateEntity(
  companyGuid: string,
  certificate: {
    fingerprint: string;
    subject?: string;
    issuer?: string;
    validFrom?: string;
    validTo?: string;
    expired?: boolean;
  }
): Entity {
  return createIntegrationEntity({
    entityData: {
      source: certificate,
      assign: {
        _key: `bitsight_certificate:${companyGuid}:${certificate.fingerprint}`,
        _type: BITSIGHT_CERTIFICATE,
        _class: EntityClasses.CERTIFICATE,
        name: certificate.subject || certificate.fingerprint,
        displayName: certificate.subject || certificate.fingerprint,
        fingerprint: certificate.fingerprint,
        subject: certificate.subject,
        issuer: certificate.issuer,
        validFrom: parseTimePropertyValue(certificate.validFrom),
        validTo: parseTimePropertyValue(certificate.validTo),
        expired: certificate.expired,
      },
    },
  });
}
