/**
 * Bitsight API Client
 * Handles authentication and API requests to Bitsight
 */

import fetch, { Response } from 'node-fetch';
import {
  IntegrationProviderAuthenticationError,
  IntegrationProviderAPIError,
} from '@jupiterone/integration-sdk-core';
import {
  BitsightCompany,
  BitsightFinding,
  BitsightRiskVector,
  BitsightAsset,
} from './types';

export interface BitsightClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export class BitsightClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: BitsightClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.bitsighttech.com';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const response: Response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (response.status === 401) {
      throw new IntegrationProviderAuthenticationError({
        cause: new Error('Invalid API key'),
        endpoint,
        status: 401,
        statusText: 'Unauthorized',
      });
    }

    if (!response.ok) {
      throw new IntegrationProviderAPIError({
        cause: new Error(`API request failed: ${response.statusText}`),
        endpoint,
        status: response.status,
        statusText: response.statusText,
      });
    }

    return response.json() as Promise<T>;
  }

  /**
   * Verify API credentials by fetching current user's portfolio
   */
  async verifyAuthentication(): Promise<boolean> {
    await this.request('/ratings/v1/portfolio');
    return true;
  }

  /**
   * Get the portfolio (list of companies being monitored)
   */
  async getPortfolio(): Promise<PaginatedResponse<BitsightCompany>> {
    return this.request('/ratings/v1/portfolio');
  }

  /**
   * Get details for a specific company
   */
  async getCompany(companyGuid: string): Promise<BitsightCompany> {
    return this.request(`/ratings/v1/companies/${companyGuid}`);
  }

  /**
   * Get my company (the company associated with API key)
   */
  async getMyCompany(): Promise<BitsightCompany> {
    return this.request('/ratings/v1/companies/my-company');
  }

  /**
   * Get risk vectors for a company
   */
  async getRiskVectors(companyGuid: string): Promise<{ risk_vectors: BitsightRiskVector[] }> {
    return this.request(`/ratings/v1/companies/${companyGuid}/risk-vectors`);
  }

  /**
   * Get findings for a company with pagination
   */
  async getFindings(
    companyGuid: string,
    options?: {
      limit?: number;
      offset?: number;
      riskVector?: string;
      severity?: string;
    }
  ): Promise<PaginatedResponse<BitsightFinding>> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.riskVector) params.append('risk_vector', options.riskVector);
    if (options?.severity) params.append('severity', options.severity);

    const queryString = params.toString();
    const endpoint = `/ratings/v1/companies/${companyGuid}/findings${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  /**
   * Iterate through all findings with pagination
   */
  async *iterateFindings(
    companyGuid: string,
    options?: { riskVector?: string; severity?: string }
  ): AsyncGenerator<BitsightFinding> {
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.getFindings(companyGuid, {
        limit,
        offset,
        ...options,
      });

      for (const finding of response.results) {
        yield finding;
      }

      if (!response.next) {
        break;
      }
      offset += limit;
    }
  }

  /**
   * Get assets (IP addresses, domains) for a company
   */
  async getAssets(
    companyGuid: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PaginatedResponse<BitsightAsset>> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const endpoint = `/ratings/v1/companies/${companyGuid}/assets${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  /**
   * Iterate through all assets with pagination
   */
  async *iterateAssets(companyGuid: string): AsyncGenerator<BitsightAsset> {
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.getAssets(companyGuid, { limit, offset });

      for (const asset of response.results) {
        yield asset;
      }

      if (!response.next) {
        break;
      }
      offset += limit;
    }
  }

  /**
   * Get rating history for a company
   */
  async getRatingHistory(companyGuid: string): Promise<{
    ratings: Array<{ date: string; rating: number }>;
  }> {
    return this.request(`/ratings/v1/companies/${companyGuid}/rating-history`);
  }

  /**
   * Get highlighted findings (critical issues)
   */
  async getHighlights(companyGuid: string): Promise<{
    highlights: Array<{
      slug: string;
      name: string;
      count: number;
      severity: string;
    }>;
  }> {
    return this.request(`/ratings/v1/companies/${companyGuid}/highlights`);
  }

  /**
   * Get subsidiaries for a company
   */
  async getSubsidiaries(companyGuid: string): Promise<PaginatedResponse<BitsightCompany>> {
    return this.request(`/ratings/v1/companies/${companyGuid}/subsidiaries`);
  }

  /**
   * Get observed IPs for a company
   */
  async getObservedIps(
    companyGuid: string,
    options?: { limit?: number; offset?: number }
  ): Promise<
    PaginatedResponse<{
      ip_address: string;
      country_code: string;
      hosted_by: string;
    }>
  > {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    return this.request(
      `/ratings/v1/companies/${companyGuid}/observed-ips${queryString ? `?${queryString}` : ''}`
    );
  }
}

export function createBitsightClient(config: BitsightClientConfig): BitsightClient {
  return new BitsightClient(config);
}
