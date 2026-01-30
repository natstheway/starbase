/**
 * Tenable EASM API Client
 * Handles authentication and API requests to Tenable Attack Surface Management
 */

import fetch, { Response } from 'node-fetch';
import {
  IntegrationProviderAuthenticationError,
  IntegrationProviderAPIError,
} from '@jupiterone/integration-sdk-core';
import {
  TenableEASMInventory,
  TenableEASMAsset,
  TenableEASMDomain,
  TenableEASMSubdomain,
  TenableEASMIpAddress,
  TenableEASMCertificate,
  TenableEASMVulnerability,
  TenableEASMWebApplication,
} from './types';

export interface TenableEASMClientConfig {
  accessKey: string;
  secretKey: string;
  region?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
}

export class TenableEASMClient {
  private accessKey: string;
  private secretKey: string;
  private baseUrl: string;

  constructor(config: TenableEASMClientConfig) {
    this.accessKey = config.accessKey;
    this.secretKey = config.secretKey;

    // Tenable EASM uses different regional endpoints
    const region = config.region || 'us';
    this.baseUrl = `https://asm.${region}.tenable.com/api/v1`;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response: Response = await fetch(url, {
      ...options,
      headers: {
        'X-ApiKeys': `accessKey=${this.accessKey};secretKey=${this.secretKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new IntegrationProviderAuthenticationError({
        cause: new Error('Invalid API keys or insufficient permissions'),
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
    await this.request('/inventories');
    return true;
  }

  /**
   * Get all inventories
   */
  async getInventories(): Promise<TenableEASMInventory[]> {
    const response = await this.request<{ inventories: TenableEASMInventory[] }>(
      '/inventories'
    );
    return response.inventories;
  }

  /**
   * Get inventory details
   */
  async getInventory(inventoryId: string): Promise<TenableEASMInventory> {
    return this.request(`/inventories/${inventoryId}`);
  }

  /**
   * Get assets from inventory
   */
  async getAssets(
    inventoryId: string,
    offset = 0,
    limit = 100
  ): Promise<PaginatedResponse<TenableEASMAsset>> {
    return this.request(
      `/inventories/${inventoryId}/assets?offset=${offset}&limit=${limit}`
    );
  }

  /**
   * Iterate through all assets
   */
  async *iterateAssets(inventoryId: string): AsyncGenerator<TenableEASMAsset> {
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.getAssets(inventoryId, offset, limit);

      for (const asset of response.data) {
        yield asset;
      }

      if (offset + limit >= response.pagination.total) {
        break;
      }
      offset += limit;
    }
  }

  /**
   * Get domains
   */
  async getDomains(
    inventoryId: string,
    offset = 0,
    limit = 100
  ): Promise<PaginatedResponse<TenableEASMDomain>> {
    return this.request(
      `/inventories/${inventoryId}/domains?offset=${offset}&limit=${limit}`
    );
  }

  /**
   * Iterate through all domains
   */
  async *iterateDomains(inventoryId: string): AsyncGenerator<TenableEASMDomain> {
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.getDomains(inventoryId, offset, limit);

      for (const domain of response.data) {
        yield domain;
      }

      if (offset + limit >= response.pagination.total) {
        break;
      }
      offset += limit;
    }
  }

  /**
   * Get subdomains for a domain
   */
  async getSubdomains(
    inventoryId: string,
    domainId: string,
    offset = 0,
    limit = 100
  ): Promise<PaginatedResponse<TenableEASMSubdomain>> {
    return this.request(
      `/inventories/${inventoryId}/domains/${domainId}/subdomains?offset=${offset}&limit=${limit}`
    );
  }

  /**
   * Iterate through all subdomains
   */
  async *iterateSubdomains(
    inventoryId: string,
    domainId: string
  ): AsyncGenerator<TenableEASMSubdomain> {
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.getSubdomains(inventoryId, domainId, offset, limit);

      for (const subdomain of response.data) {
        yield subdomain;
      }

      if (offset + limit >= response.pagination.total) {
        break;
      }
      offset += limit;
    }
  }

  /**
   * Get IP addresses
   */
  async getIpAddresses(
    inventoryId: string,
    offset = 0,
    limit = 100
  ): Promise<PaginatedResponse<TenableEASMIpAddress>> {
    return this.request(
      `/inventories/${inventoryId}/ips?offset=${offset}&limit=${limit}`
    );
  }

  /**
   * Iterate through all IP addresses
   */
  async *iterateIpAddresses(
    inventoryId: string
  ): AsyncGenerator<TenableEASMIpAddress> {
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.getIpAddresses(inventoryId, offset, limit);

      for (const ip of response.data) {
        yield ip;
      }

      if (offset + limit >= response.pagination.total) {
        break;
      }
      offset += limit;
    }
  }

  /**
   * Get certificates
   */
  async getCertificates(
    inventoryId: string,
    offset = 0,
    limit = 100
  ): Promise<PaginatedResponse<TenableEASMCertificate>> {
    return this.request(
      `/inventories/${inventoryId}/certificates?offset=${offset}&limit=${limit}`
    );
  }

  /**
   * Iterate through all certificates
   */
  async *iterateCertificates(
    inventoryId: string
  ): AsyncGenerator<TenableEASMCertificate> {
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.getCertificates(inventoryId, offset, limit);

      for (const cert of response.data) {
        yield cert;
      }

      if (offset + limit >= response.pagination.total) {
        break;
      }
      offset += limit;
    }
  }

  /**
   * Get vulnerabilities
   */
  async getVulnerabilities(
    inventoryId: string,
    offset = 0,
    limit = 100
  ): Promise<PaginatedResponse<TenableEASMVulnerability>> {
    return this.request(
      `/inventories/${inventoryId}/vulnerabilities?offset=${offset}&limit=${limit}`
    );
  }

  /**
   * Iterate through all vulnerabilities
   */
  async *iterateVulnerabilities(
    inventoryId: string
  ): AsyncGenerator<TenableEASMVulnerability> {
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.getVulnerabilities(inventoryId, offset, limit);

      for (const vuln of response.data) {
        yield vuln;
      }

      if (offset + limit >= response.pagination.total) {
        break;
      }
      offset += limit;
    }
  }

  /**
   * Get web applications
   */
  async getWebApplications(
    inventoryId: string,
    offset = 0,
    limit = 100
  ): Promise<PaginatedResponse<TenableEASMWebApplication>> {
    return this.request(
      `/inventories/${inventoryId}/web-applications?offset=${offset}&limit=${limit}`
    );
  }

  /**
   * Iterate through all web applications
   */
  async *iterateWebApplications(
    inventoryId: string
  ): AsyncGenerator<TenableEASMWebApplication> {
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.getWebApplications(inventoryId, offset, limit);

      for (const webapp of response.data) {
        yield webapp;
      }

      if (offset + limit >= response.pagination.total) {
        break;
      }
      offset += limit;
    }
  }
}

export function createTenableEASMClient(
  config: TenableEASMClientConfig
): TenableEASMClient {
  return new TenableEASMClient(config);
}
