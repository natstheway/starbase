/**
 * Generic EASM Scanner Data Client
 * Supports loading data from JSON files, CSV files, or custom APIs
 */

import * as fs from 'fs';
import * as path from 'path';
import fetch, { Response } from 'node-fetch';
import { parse } from 'csv-parse/sync';
import {
  IntegrationProviderAPIError,
} from '@jupiterone/integration-sdk-core';
import {
  ScannerReport,
  ScannerAssetData,
  ScannerDomainData,
  ScannerSubdomainData,
  ScannerIpData,
  ScannerPortData,
  ScannerVulnerabilityData,
  ScannerFindingData,
  ScannerCertificateData,
  ScannerTechnologyData,
} from './types';

export interface EASMScannerClientConfig {
  scannerName: string;
  dataSourceType: 'file' | 'api';
  dataFilePath?: string;
  apiUrl?: string;
  apiKey?: string;
  apiAuthHeader?: string;
}

export class EASMScannerClient {
  private config: EASMScannerClientConfig;

  constructor(config: EASMScannerClientConfig) {
    this.config = config;
  }

  /**
   * Load scanner report from configured data source
   */
  async loadReport(): Promise<ScannerReport> {
    if (this.config.dataSourceType === 'file') {
      return this.loadFromFile();
    } else {
      return this.loadFromApi();
    }
  }

  /**
   * Load data from JSON or CSV file
   */
  private async loadFromFile(): Promise<ScannerReport> {
    if (!this.config.dataFilePath) {
      throw new Error('Data file path is required for file-based data source');
    }

    const filePath = path.resolve(this.config.dataFilePath);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Data file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileExtension = path.extname(filePath).toLowerCase();

    if (fileExtension === '.json') {
      return this.parseJsonReport(fileContent);
    } else if (fileExtension === '.csv') {
      return this.parseCsvReport(fileContent);
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}. Use .json or .csv`);
    }
  }

  /**
   * Parse JSON report
   */
  private parseJsonReport(content: string): ScannerReport {
    try {
      const data = JSON.parse(content);

      // Handle both full report format and array of findings/assets
      if (data.scan) {
        return data as ScannerReport;
      }

      // If it's an array, try to determine the data type
      if (Array.isArray(data)) {
        return this.inferReportFromArray(data);
      }

      // If it's an object with specific keys, try to map it
      return this.normalizeReport(data);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Infer report structure from array data
   */
  private inferReportFromArray(data: Record<string, unknown>[]): ScannerReport {
    const report: ScannerReport = {
      scan: {
        id: `${this.config.scannerName}-${Date.now()}`,
        name: `${this.config.scannerName} Import`,
        scanner_name: this.config.scannerName,
        completed_at: new Date().toISOString(),
        status: 'completed',
      },
    };

    if (data.length === 0) {
      return report;
    }

    // Check first item to determine type
    const sample = data[0];

    if ('cve_ids' in sample || 'cvss_score' in sample || 'vulnerability' in sample) {
      report.vulnerabilities = data as unknown as ScannerVulnerabilityData[];
    } else if ('domain' in sample && !('subdomain' in sample)) {
      report.domains = data as unknown as ScannerDomainData[];
    } else if ('subdomain' in sample) {
      report.subdomains = data as unknown as ScannerSubdomainData[];
    } else if ('ip_address' in sample || 'ip' in sample) {
      report.ip_addresses = this.normalizeIpData(data);
    } else if ('port' in sample && 'protocol' in sample) {
      report.ports = data as unknown as ScannerPortData[];
    } else if ('serial_number' in sample || 'subject_cn' in sample) {
      report.certificates = data as unknown as ScannerCertificateData[];
    } else if ('finding' in sample || 'title' in sample) {
      report.findings = data as unknown as ScannerFindingData[];
    } else {
      report.assets = this.normalizeAssetData(data);
    }

    return report;
  }

  /**
   * Normalize different IP data formats
   */
  private normalizeIpData(data: Record<string, unknown>[]): ScannerIpData[] {
    return data.map((item) => ({
      id: (item.id as string) || (item.ip_address as string) || (item.ip as string),
      ip_address: (item.ip_address as string) || (item.ip as string) || '',
      version: (item.version as 4 | 6) || (item.ip_address?.includes(':') ? 6 : 4),
      hostname: item.hostname as string,
      asn: item.asn as string,
      asn_name: item.asn_name as string,
      country: item.country as string,
      city: item.city as string,
      isp: item.isp as string,
      cloud_provider: item.cloud_provider as string,
      is_public: item.is_public as boolean ?? true,
      first_seen: item.first_seen as string,
      last_seen: item.last_seen as string,
      metadata: item.metadata as Record<string, unknown>,
    }));
  }

  /**
   * Normalize asset data
   */
  private normalizeAssetData(data: Record<string, unknown>[]): ScannerAssetData[] {
    return data.map((item) => ({
      id: (item.id as string) || `asset-${Math.random().toString(36).substring(7)}`,
      type: (item.type as ScannerAssetData['type']) || 'other',
      value: (item.value as string) || (item.name as string) || (item.asset as string) || '',
      name: item.name as string,
      first_seen: item.first_seen as string,
      last_seen: item.last_seen as string,
      confidence: item.confidence as number,
      source: item.source as string,
      tags: item.tags as string[],
      metadata: item.metadata as Record<string, unknown>,
    }));
  }

  /**
   * Normalize report from various formats
   */
  private normalizeReport(data: Record<string, unknown>): ScannerReport {
    const report: ScannerReport = {
      scan: {
        id: (data.scan_id as string) || `${this.config.scannerName}-${Date.now()}`,
        name: (data.scan_name as string) || `${this.config.scannerName} Import`,
        scanner_name: this.config.scannerName,
        completed_at: (data.completed_at as string) || new Date().toISOString(),
        status: 'completed',
      },
    };

    // Map common variations
    const mappings: Record<string, keyof ScannerReport> = {
      assets: 'assets',
      hosts: 'assets',
      domains: 'domains',
      subdomains: 'subdomains',
      ip_addresses: 'ip_addresses',
      ips: 'ip_addresses',
      ports: 'ports',
      services: 'ports',
      vulnerabilities: 'vulnerabilities',
      vulns: 'vulnerabilities',
      findings: 'findings',
      issues: 'findings',
      certificates: 'certificates',
      certs: 'certificates',
      technologies: 'technologies',
      tech: 'technologies',
    };

    for (const [key, targetKey] of Object.entries(mappings)) {
      if (data[key] && Array.isArray(data[key])) {
        (report as Record<string, unknown>)[targetKey] = data[key];
      }
    }

    return report;
  }

  /**
   * Parse CSV report
   */
  private parseCsvReport(content: string): ScannerReport {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    return this.inferReportFromArray(records);
  }

  /**
   * Load data from API
   */
  private async loadFromApi(): Promise<ScannerReport> {
    if (!this.config.apiUrl) {
      throw new Error('API URL is required for API-based data source');
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      const authHeader = this.config.apiAuthHeader || 'Authorization';
      headers[authHeader] = this.config.apiKey.startsWith('Bearer ')
        ? this.config.apiKey
        : `Bearer ${this.config.apiKey}`;
    }

    const response: Response = await fetch(this.config.apiUrl, { headers });

    if (!response.ok) {
      throw new IntegrationProviderAPIError({
        cause: new Error(`API request failed: ${response.statusText}`),
        endpoint: this.config.apiUrl,
        status: response.status,
        statusText: response.statusText,
      });
    }

    const data = await response.json();
    return this.normalizeReport(data as Record<string, unknown>);
  }

  /**
   * Verify data source is accessible
   */
  async verifyDataSource(): Promise<boolean> {
    if (this.config.dataSourceType === 'file') {
      if (!this.config.dataFilePath) {
        throw new Error('Data file path is required');
      }
      return fs.existsSync(path.resolve(this.config.dataFilePath));
    } else {
      if (!this.config.apiUrl) {
        throw new Error('API URL is required');
      }
      // Try a HEAD request to verify API is accessible
      const headers: Record<string, string> = {};
      if (this.config.apiKey) {
        const authHeader = this.config.apiAuthHeader || 'Authorization';
        headers[authHeader] = this.config.apiKey.startsWith('Bearer ')
          ? this.config.apiKey
          : `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(this.config.apiUrl, {
        method: 'HEAD',
        headers,
      });
      return response.ok;
    }
  }
}

export function createEASMScannerClient(
  config: EASMScannerClientConfig
): EASMScannerClient {
  return new EASMScannerClient(config);
}
