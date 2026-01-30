# EASM Integrations for Starbase

This directory contains External Attack Surface Management (EASM) integrations for Starbase. These integrations collect security data from various EASM platforms and custom scanners, normalizing it into a graph format for storage in Neo4j or JupiterOne.

## Available Integrations

### 1. graph-bitsight
**Bitsight Security Ratings Integration**

Collects security ratings, risk vectors, assets, and findings from Bitsight.

**Entity Types:**
- `bitsight_account` - Bitsight account
- `bitsight_company` - Monitored company
- `bitsight_rating` - Security rating
- `bitsight_risk_vector` - Risk vector scores
- `bitsight_asset` - External asset
- `bitsight_finding` - Security finding
- `bitsight_vulnerability` - CVE vulnerability
- `bitsight_domain` - Domain
- `bitsight_ip_address` - IP address
- `bitsight_certificate` - SSL certificate

**Configuration:**
```yaml
config:
  BITSIGHT_API_KEY: your-api-key
  BITSIGHT_INCLUDE_SUBSIDIARIES: true
  BITSIGHT_INCLUDE_FINDINGS_HISTORY: false
```

### 2. graph-ctm360
**CTM360 Attack Surface Management Integration**

Collects external attack surface data, threat intelligence, data leaks, and brand abuse incidents.

**Entity Types:**
- `ctm360_account` - CTM360 account
- `ctm360_organization` - Organization
- `ctm360_domain` - Domain
- `ctm360_subdomain` - Subdomain
- `ctm360_ip_address` - IP address
- `ctm360_service` - Network service
- `ctm360_vulnerability` - Vulnerability
- `ctm360_threat` - Threat intelligence
- `ctm360_exposure` - Security exposure
- `ctm360_data_leak` - Data leak incident
- `ctm360_brand_abuse` - Brand abuse incident

**Configuration:**
```yaml
config:
  CTM360_API_KEY: your-api-key
  CTM360_TENANT_ID: your-tenant-id
  CTM360_INCLUDE_THREATS: true
  CTM360_INCLUDE_DATA_LEAKS: true
  CTM360_INCLUDE_BRAND_ABUSE: true
```

### 3. graph-tenable-easm
**Tenable External Attack Surface Management Integration**

Collects data from Tenable ASM (formerly Tenable.asm / Bit Discovery).

**Entity Types:**
- `tenable_easm_account` - Tenable account
- `tenable_easm_inventory` - Asset inventory
- `tenable_easm_domain` - Domain
- `tenable_easm_subdomain` - Subdomain
- `tenable_easm_ip_address` - IP address
- `tenable_easm_port` - Open port
- `tenable_easm_service` - Network service
- `tenable_easm_certificate` - SSL certificate
- `tenable_easm_vulnerability` - Vulnerability
- `tenable_easm_web_application` - Web application

**Configuration:**
```yaml
config:
  TENABLE_EASM_ACCESS_KEY: your-access-key
  TENABLE_EASM_SECRET_KEY: your-secret-key
  TENABLE_EASM_REGION: us
  TENABLE_EASM_INVENTORY_ID: optional-specific-inventory
  TENABLE_EASM_INCLUDE_WEB_APPS: true
```

### 4. graph-easm-scanner
**Generic EASM Scanner Integration**

A flexible integration for importing data from custom scanners, internal tools, or any EASM platform without a native integration. Supports JSON and CSV file imports as well as custom API endpoints.

**Entity Types:**
- `easm_scanner_account` - Scanner account
- `easm_scanner_scan` - Scan assessment
- `easm_scanner_asset` - Generic asset
- `easm_scanner_domain` - Domain
- `easm_scanner_subdomain` - Subdomain
- `easm_scanner_ip_address` - IP address
- `easm_scanner_port` - Open port
- `easm_scanner_service` - Network service
- `easm_scanner_vulnerability` - Vulnerability
- `easm_scanner_finding` - Security finding
- `easm_scanner_certificate` - SSL certificate
- `easm_scanner_technology` - Detected technology

**Configuration (File-based):**
```yaml
config:
  EASM_SCANNER_NAME: my-scanner
  EASM_SCANNER_DATA_SOURCE_TYPE: file
  EASM_SCANNER_DATA_FILE_PATH: ./scan-results.json
```

**Configuration (API-based):**
```yaml
config:
  EASM_SCANNER_NAME: my-scanner
  EASM_SCANNER_DATA_SOURCE_TYPE: api
  EASM_SCANNER_API_URL: https://api.my-scanner.com/results
  EASM_SCANNER_API_KEY: your-api-key
```

## Quick Start

1. **Install dependencies:**
   ```bash
   cd integrations/graph-bitsight  # or any integration
   yarn install
   ```

2. **Configure credentials:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run the integration:**
   ```bash
   yarn start
   ```

4. **Visualize the data:**
   ```bash
   yarn graph
   ```

## Using with Starbase

Add the integrations to your `config.yaml`:

```yaml
integrations:
  - name: graph-bitsight
    instanceId: bitsight-prod
    directory: ./integrations/graph-bitsight
    config:
      BITSIGHT_API_KEY: your-api-key

storage:
  - engine: neo4j
    config:
      username: neo4j
      password: password
      uri: bolt://localhost:7687
```

Then run:
```bash
yarn starbase setup
yarn starbase run
```

## Data Model

All integrations follow the JupiterOne data model conventions:

- **Entities** have `_type`, `_class`, and `_key` properties
- **Relationships** connect entities with verbs like HAS, IDENTIFIED, USES
- **Properties** are normalized to camelCase

### Common Entity Classes

| Class | Description |
|-------|-------------|
| Account | Integration account |
| Organization | Company/organization |
| Host | Server, computer, or container |
| Domain | DNS domain |
| IpAddress | IP address (v4 or v6) |
| Port | Network port |
| Service | Network service |
| Vulnerability | Security vulnerability |
| Finding | Security finding |
| Certificate | SSL/TLS certificate |
| Assessment | Scan or assessment |

## Extending the Integrations

### Adding New Entity Types

1. Define types in `src/types/index.ts`
2. Create converter in `src/converters/index.ts`
3. Add step in `src/steps/`
4. Register step in `src/index.ts`

### Custom Data Transformations

The `graph-easm-scanner` integration supports custom data formats. See `sample-data.json` for the expected schema, or use the flexible array format:

```json
[
  {
    "ip_address": "192.0.2.1",
    "port": 443,
    "service_name": "https"
  }
]
```

The integration will automatically detect the data type and create appropriate entities.

## Querying the Data

Once data is in Neo4j, you can run Cypher queries:

```cypher
// Find all critical vulnerabilities
MATCH (v:Vulnerability)
WHERE v.severity = 'critical'
RETURN v.name, v.cveIds, v.affectedAssets

// Find exposed services
MATCH (ip:IpAddress)-[:HAS]->(p:Port)-[:HAS]->(s:Service)
WHERE p.state = 'open'
RETURN ip.ipAddress, p.port, s.name

// Find domains with expiring certificates
MATCH (d:Domain)-[:HAS]->(c:Certificate)
WHERE c.validTo < datetime() + duration('P30D')
RETURN d.domainName, c.validTo
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MPL-2.0
