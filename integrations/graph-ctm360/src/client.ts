/**
 * CTM360 API Client
 * Handles authentication and API requests to CTM360 platform
 */

import fetch, { Response } from 'node-fetch';
import {
  IntegrationProviderAuthenticationError,
  IntegrationProviderAPIError,
} from '@jupiterone/integration-sdk-core';
import {
  CTM360Organization,
  CTM360Domain,
  CTM360Subdomain,
  CTM360IpAddress,
  CTM360Vulnerability,
  CTM360Threat,
  CTM360Exposure,
  CTM360DataLeak,
  CTM360BrandAbuse,
} from './types';

export interface CTM360ClientConfig {
  apiKey: string;
  apiUrl?: string;
  tenantId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export class CTM360Client {
  private apiKey: string;
  private apiUrl: string;
  private tenantId?: string;

  constructor(config: CTM360ClientConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'https://api.ctm360.com/v1';
    this.tenantId = config.tenantId;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.tenantId) {
      headers['X-Tenant-ID'] = this.tenantId;
    }

    const response: Response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new IntegrationProviderAuthenticationError({
        cause: new Error('Invalid API key or insufficient permissions'),
        endpoint,
        status: response.status,
        statusText: response.statusText,
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
   * Verify API credentials
   */
  async verifyAuthentication(): Promise<boolean> {
    await this.request('/auth/verify');
    return true;
  }

  /**
   * Get organization details
   */
  async getOrganization(): Promise<CTM360Organization> {
    return this.request('/organization');
  }

  /**
   * Get all monitored domains
   */
  async getDomains(page = 1, perPage = 100): Promise<PaginatedResponse<CTM360Domain>> {
    return this.request(`/domains?page=${page}&per_page=${perPage}`);
  }

  /**
   * Iterate through all domains
   */
  async *iterateDomains(): AsyncGenerator<CTM360Domain> {
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await this.getDomains(page, perPage);

      for (const domain of response.data) {
        yield domain;
      }

      if (page >= response.pagination.total_pages) {
        break;
      }
      page++;
    }
  }

  /**
   * Get subdomains for a domain
   */
  async getSubdomains(
    domainId: string,
    page = 1,
    perPage = 100
  ): Promise<PaginatedResponse<CTM360Subdomain>> {
    return this.request(`/domains/${domainId}/subdomains?page=${page}&per_page=${perPage}`);
  }

  /**
   * Iterate through all subdomains for a domain
   */
  async *iterateSubdomains(domainId: string): AsyncGenerator<CTM360Subdomain> {
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await this.getSubdomains(domainId, page, perPage);

      for (const subdomain of response.data) {
        yield subdomain;
      }

      if (page >= response.pagination.total_pages) {
        break;
      }
      page++;
    }
  }

  /**
   * Get discovered IP addresses
   */
  async getIpAddresses(page = 1, perPage = 100): Promise<PaginatedResponse<CTM360IpAddress>> {
    return this.request(`/assets/ips?page=${page}&per_page=${perPage}`);
  }

  /**
   * Iterate through all IP addresses
   */
  async *iterateIpAddresses(): AsyncGenerator<CTM360IpAddress> {
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await this.getIpAddresses(page, perPage);

      for (const ip of response.data) {
        yield ip;
      }

      if (page >= response.pagination.total_pages) {
        break;
      }
      page++;
    }
  }

  /**
   * Get vulnerabilities
   */
  async getVulnerabilities(
    page = 1,
    perPage = 100,
    filters?: { severity?: string; status?: string }
  ): Promise<PaginatedResponse<CTM360Vulnerability>> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.status) params.append('status', filters.status);

    return this.request(`/vulnerabilities?${params.toString()}`);
  }

  /**
   * Iterate through all vulnerabilities
   */
  async *iterateVulnerabilities(filters?: {
    severity?: string;
    status?: string;
  }): AsyncGenerator<CTM360Vulnerability> {
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await this.getVulnerabilities(page, perPage, filters);

      for (const vuln of response.data) {
        yield vuln;
      }

      if (page >= response.pagination.total_pages) {
        break;
      }
      page++;
    }
  }

  /**
   * Get threat intelligence
   */
  async getThreats(page = 1, perPage = 100): Promise<PaginatedResponse<CTM360Threat>> {
    return this.request(`/threats?page=${page}&per_page=${perPage}`);
  }

  /**
   * Iterate through all threats
   */
  async *iterateThreats(): AsyncGenerator<CTM360Threat> {
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await this.getThreats(page, perPage);

      for (const threat of response.data) {
        yield threat;
      }

      if (page >= response.pagination.total_pages) {
        break;
      }
      page++;
    }
  }

  /**
   * Get exposures
   */
  async getExposures(page = 1, perPage = 100): Promise<PaginatedResponse<CTM360Exposure>> {
    return this.request(`/exposures?page=${page}&per_page=${perPage}`);
  }

  /**
   * Iterate through all exposures
   */
  async *iterateExposures(): AsyncGenerator<CTM360Exposure> {
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await this.getExposures(page, perPage);

      for (const exposure of response.data) {
        yield exposure;
      }

      if (page >= response.pagination.total_pages) {
        break;
      }
      page++;
    }
  }

  /**
   * Get data leaks
   */
  async getDataLeaks(page = 1, perPage = 100): Promise<PaginatedResponse<CTM360DataLeak>> {
    return this.request(`/data-leaks?page=${page}&per_page=${perPage}`);
  }

  /**
   * Iterate through all data leaks
   */
  async *iterateDataLeaks(): AsyncGenerator<CTM360DataLeak> {
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await this.getDataLeaks(page, perPage);

      for (const leak of response.data) {
        yield leak;
      }

      if (page >= response.pagination.total_pages) {
        break;
      }
      page++;
    }
  }

  /**
   * Get brand abuse incidents
   */
  async getBrandAbuse(page = 1, perPage = 100): Promise<PaginatedResponse<CTM360BrandAbuse>> {
    return this.request(`/brand-protection/abuse?page=${page}&per_page=${perPage}`);
  }

  /**
   * Iterate through all brand abuse incidents
   */
  async *iterateBrandAbuse(): AsyncGenerator<CTM360BrandAbuse> {
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await this.getBrandAbuse(page, perPage);

      for (const abuse of response.data) {
        yield abuse;
      }

      if (page >= response.pagination.total_pages) {
        break;
      }
      page++;
    }
  }
}

export function createCTM360Client(config: CTM360ClientConfig): CTM360Client {
  return new CTM360Client(config);
}
