/**
 * Starbase EASM Backend API Server
 * Connects to Neo4j and provides REST endpoints for the frontend
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import neo4j, { Driver, Session } from 'neo4j-driver';

const app = express();
const PORT = process.env.PORT || 4000;

// Neo4j connection configuration
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'devpass';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

let driver: Driver;

// Initialize Neo4j connection
async function initNeo4j(): Promise<void> {
  try {
    driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
    await driver.verifyConnectivity();
    console.log('Connected to Neo4j');
  } catch (error) {
    console.error('Failed to connect to Neo4j:', error);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Helper to run Cypher queries
async function runQuery<T>(cypher: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const session: Session = driver.session({ database: NEO4J_DATABASE });
  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => record.toObject() as T);
  } finally {
    await session.close();
  }
}

// Convert Neo4j integers to JavaScript numbers
function toNumber(value: unknown): number {
  if (neo4j.isInt(value)) {
    return (value as neo4j.Integer).toNumber();
  }
  return value as number;
}

// ============================================
// Dashboard API Endpoints
// ============================================

// Get dashboard statistics
app.get('/api/dashboard/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await runQuery<Record<string, unknown>>(`
      MATCH (n)
      WITH labels(n) AS labels, count(n) AS count
      UNWIND labels AS label
      RETURN label, sum(count) AS count
      ORDER BY count DESC
    `);

    const relationships = await runQuery<Record<string, unknown>>(`
      MATCH ()-[r]->()
      RETURN type(r) AS type, count(r) AS count
      ORDER BY count DESC
      LIMIT 20
    `);

    const severityCounts = await runQuery<Record<string, unknown>>(`
      MATCH (n)
      WHERE n.severity IS NOT NULL
      RETURN n.severity AS severity, count(n) AS count
    `);

    res.json({
      entityCounts: stats.map((s) => ({
        label: s.label,
        count: toNumber(s.count),
      })),
      relationshipCounts: relationships.map((r) => ({
        type: r.type,
        count: toNumber(r.count),
      })),
      severityCounts: severityCounts.map((s) => ({
        severity: s.severity,
        count: toNumber(s.count),
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent findings/vulnerabilities
app.get('/api/dashboard/recent', async (_req: Request, res: Response) => {
  try {
    const recentFindings = await runQuery<Record<string, unknown>>(`
      MATCH (n)
      WHERE n._class IN ['Finding', 'Vulnerability'] AND n.discoveredOn IS NOT NULL
      RETURN n._type AS type, n.name AS name, n.severity AS severity,
             n.discoveredOn AS discoveredOn, n._key AS key
      ORDER BY n.discoveredOn DESC
      LIMIT 10
    `);

    res.json({ recentFindings });
  } catch (error) {
    console.error('Error fetching recent findings:', error);
    res.status(500).json({ error: 'Failed to fetch recent findings' });
  }
});

// ============================================
// Graph Visualization API Endpoints
// ============================================

// Get graph data for visualization
app.get('/api/graph', async (req: Request, res: Response) => {
  try {
    const { entityTypes, limit = 100, search } = req.query;

    let matchClause = 'MATCH (n)';
    const params: Record<string, unknown> = { limit: parseInt(limit as string, 10) };

    // Filter by entity types
    if (entityTypes) {
      const types = (entityTypes as string).split(',');
      matchClause = `MATCH (n) WHERE n._type IN $types`;
      params.types = types;
    }

    // Search filter
    if (search) {
      matchClause += entityTypes
        ? ` AND (n.name CONTAINS $search OR n.displayName CONTAINS $search OR n._key CONTAINS $search)`
        : ` WHERE (n.name CONTAINS $search OR n.displayName CONTAINS $search OR n._key CONTAINS $search)`;
      params.search = search;
    }

    // Get nodes
    const nodes = await runQuery<Record<string, unknown>>(`
      ${matchClause}
      RETURN n._key AS id, n._type AS type, n._class AS class,
             n.name AS name, n.displayName AS displayName,
             n.severity AS severity, properties(n) AS properties
      LIMIT $limit
    `, params);

    // Get relationships between these nodes
    const nodeIds = nodes.map((n) => n.id);
    const relationships = await runQuery<Record<string, unknown>>(`
      MATCH (a)-[r]->(b)
      WHERE a._key IN $nodeIds AND b._key IN $nodeIds
      RETURN a._key AS source, b._key AS target, type(r) AS type
    `, { nodeIds });

    res.json({
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        class: n.class,
        label: n.displayName || n.name || n.id,
        severity: n.severity,
        properties: n.properties,
      })),
      edges: relationships.map((r) => ({
        source: r.source,
        target: r.target,
        type: r.type,
      })),
    });
  } catch (error) {
    console.error('Error fetching graph data:', error);
    res.status(500).json({ error: 'Failed to fetch graph data' });
  }
});

// Get neighbors of a node
app.get('/api/graph/neighbors/:nodeId', async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    const { depth = 1 } = req.query;

    const result = await runQuery<Record<string, unknown>>(`
      MATCH path = (n {_key: $nodeId})-[*1..${parseInt(depth as string, 10)}]-(m)
      WITH nodes(path) AS pathNodes, relationships(path) AS pathRels
      UNWIND pathNodes AS node
      WITH DISTINCT node, pathRels
      RETURN collect(DISTINCT {
        id: node._key,
        type: node._type,
        class: node._class,
        label: coalesce(node.displayName, node.name, node._key),
        severity: node.severity,
        properties: properties(node)
      }) AS nodes,
      [r IN pathRels | {
        source: startNode(r)._key,
        target: endNode(r)._key,
        type: type(r)
      }] AS edges
    `, { nodeId });

    if (result.length === 0) {
      return res.json({ nodes: [], edges: [] });
    }

    // Deduplicate edges
    const edgesMap = new Map();
    const allEdges = result.flatMap((r) => r.edges as Array<Record<string, string>>);
    allEdges.forEach((edge) => {
      const key = `${edge.source}-${edge.type}-${edge.target}`;
      edgesMap.set(key, edge);
    });

    res.json({
      nodes: result[0].nodes,
      edges: Array.from(edgesMap.values()),
    });
  } catch (error) {
    console.error('Error fetching neighbors:', error);
    res.status(500).json({ error: 'Failed to fetch neighbors' });
  }
});

// ============================================
// Entity API Endpoints
// ============================================

// Get all entity types
app.get('/api/entities/types', async (_req: Request, res: Response) => {
  try {
    const types = await runQuery<Record<string, unknown>>(`
      MATCH (n)
      WHERE n._type IS NOT NULL
      RETURN DISTINCT n._type AS type, n._class AS class, count(n) AS count
      ORDER BY count DESC
    `);

    res.json(types.map((t) => ({
      type: t.type,
      class: t.class,
      count: toNumber(t.count),
    })));
  } catch (error) {
    console.error('Error fetching entity types:', error);
    res.status(500).json({ error: 'Failed to fetch entity types' });
  }
});

// Search entities
app.get('/api/entities/search', async (req: Request, res: Response) => {
  try {
    const { q, type, severity, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    const params: Record<string, unknown> = {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    };

    if (q) {
      whereClause += ` AND (n.name CONTAINS $q OR n.displayName CONTAINS $q OR n._key CONTAINS $q OR n.ipAddress CONTAINS $q OR n.domainName CONTAINS $q)`;
      params.q = q;
    }

    if (type) {
      whereClause += ` AND n._type = $type`;
      params.type = type;
    }

    if (severity) {
      whereClause += ` AND n.severity = $severity`;
      params.severity = severity;
    }

    const entities = await runQuery<Record<string, unknown>>(`
      MATCH (n)
      ${whereClause}
      RETURN n._key AS id, n._type AS type, n._class AS class,
             n.name AS name, n.displayName AS displayName,
             n.severity AS severity, n.status AS status,
             n.firstSeen AS firstSeen, n.lastSeen AS lastSeen
      ORDER BY n.name
      SKIP $offset
      LIMIT $limit
    `, params);

    const countResult = await runQuery<Record<string, unknown>>(`
      MATCH (n)
      ${whereClause}
      RETURN count(n) AS total
    `, params);

    res.json({
      entities,
      total: toNumber((countResult[0] as Record<string, unknown>)?.total || 0),
      limit: params.limit,
      offset: params.offset,
    });
  } catch (error) {
    console.error('Error searching entities:', error);
    res.status(500).json({ error: 'Failed to search entities' });
  }
});

// Get entity details
app.get('/api/entities/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await runQuery<Record<string, unknown>>(`
      MATCH (n {_key: $id})
      OPTIONAL MATCH (n)-[r]->(related)
      RETURN n AS entity,
             collect(DISTINCT {
               direction: 'outgoing',
               type: type(r),
               targetId: related._key,
               targetType: related._type,
               targetName: coalesce(related.displayName, related.name)
             }) AS outgoingRelations
    `, { id });

    if (result.length === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const incomingResult = await runQuery<Record<string, unknown>>(`
      MATCH (related)-[r]->(n {_key: $id})
      RETURN collect(DISTINCT {
        direction: 'incoming',
        type: type(r),
        sourceId: related._key,
        sourceType: related._type,
        sourceName: coalesce(related.displayName, related.name)
      }) AS incomingRelations
    `, { id });

    const entity = result[0].entity as Record<string, unknown>;
    const outgoing = (result[0].outgoingRelations as Array<Record<string, unknown>>)
      .filter((r) => r.targetId != null);
    const incoming = ((incomingResult[0]?.incomingRelations || []) as Array<Record<string, unknown>>)
      .filter((r) => r.sourceId != null);

    res.json({
      entity: entity.properties || entity,
      relationships: [...outgoing, ...incoming],
    });
  } catch (error) {
    console.error('Error fetching entity:', error);
    res.status(500).json({ error: 'Failed to fetch entity' });
  }
});

// ============================================
// Query Builder API Endpoints
// ============================================

// Execute custom Cypher query (read-only)
app.post('/api/query', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    // Basic safety check - only allow read queries
    const normalizedQuery = query.toLowerCase().trim();
    const dangerousKeywords = ['create', 'delete', 'merge', 'set', 'remove', 'drop', 'detach'];

    for (const keyword of dangerousKeywords) {
      if (normalizedQuery.includes(keyword)) {
        return res.status(400).json({
          error: `Query contains forbidden keyword: ${keyword}. Only read queries are allowed.`
        });
      }
    }

    const result = await runQuery<Record<string, unknown>>(query);
    res.json({ result });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: `Query execution failed: ${(error as Error).message}` });
  }
});

// Get predefined query templates
app.get('/api/query/templates', (_req: Request, res: Response) => {
  res.json([
    {
      name: 'All Critical Vulnerabilities',
      description: 'Find all vulnerabilities with critical severity',
      query: `MATCH (v)
WHERE v._class = 'Vulnerability' AND v.severity = 'critical'
RETURN v.name AS name, v.cveIds AS cves, v.cvssScore AS cvss, v.affectedAssets AS affected
ORDER BY v.cvssScore DESC`,
    },
    {
      name: 'Exposed Services',
      description: 'Find all open ports and their services',
      query: `MATCH (ip)-[:HAS]->(p)
WHERE p._class = 'Port' AND p.open = true
OPTIONAL MATCH (p)-[:HAS]->(s)
WHERE s._class = 'Service'
RETURN ip.ipAddress AS ip, p.port AS port, p.protocol AS protocol, s.name AS service
ORDER BY ip.ipAddress, p.port`,
    },
    {
      name: 'Domain Hierarchy',
      description: 'Show domains and their subdomains',
      query: `MATCH (d)-[:HAS]->(s)
WHERE d._class = 'Domain' AND s._class = 'Domain'
RETURN d.domainName AS domain, collect(s.domainName) AS subdomains`,
    },
    {
      name: 'Assets by Country',
      description: 'Group IP addresses by country',
      query: `MATCH (ip)
WHERE ip._class = 'IpAddress' AND ip.country IS NOT NULL
RETURN ip.country AS country, count(ip) AS count
ORDER BY count DESC`,
    },
    {
      name: 'Expiring Certificates',
      description: 'Find certificates expiring in the next 30 days',
      query: `MATCH (c)
WHERE c._class = 'Certificate' AND c.validTo IS NOT NULL
WITH c, datetime(c.validTo) AS expiry
WHERE expiry < datetime() + duration('P30D')
RETURN c.name AS certificate, c.validTo AS expires, c.issuerCommonName AS issuer
ORDER BY expiry`,
    },
    {
      name: 'Vulnerability by Asset',
      description: 'Show which assets have the most vulnerabilities',
      query: `MATCH (asset)-[:HAS]->(v)
WHERE v._class = 'Vulnerability'
RETURN asset.name AS asset, asset._type AS type, count(v) AS vulnerabilities
ORDER BY vulnerabilities DESC
LIMIT 20`,
    },
    {
      name: 'Attack Surface Summary',
      description: 'Get a summary of the entire attack surface',
      query: `MATCH (n)
WHERE n._class IN ['Domain', 'IpAddress', 'Port', 'Service', 'Vulnerability', 'Finding']
RETURN n._class AS type, count(n) AS count
ORDER BY count DESC`,
    },
    {
      name: 'High Severity Findings Path',
      description: 'Trace the path from organizations to high severity findings',
      query: `MATCH path = (org)-[*1..4]->(f)
WHERE org._class = 'Organization' AND f._class IN ['Finding', 'Vulnerability'] AND f.severity IN ['critical', 'high']
RETURN path
LIMIT 25`,
    },
  ]);
});

// ============================================
// Relationship Types API
// ============================================

app.get('/api/relationships/types', async (_req: Request, res: Response) => {
  try {
    const types = await runQuery<Record<string, unknown>>(`
      MATCH ()-[r]->()
      RETURN DISTINCT type(r) AS type, count(r) AS count
      ORDER BY count DESC
    `);

    res.json(types.map((t) => ({
      type: t.type,
      count: toNumber(t.count),
    })));
  } catch (error) {
    console.error('Error fetching relationship types:', error);
    res.status(500).json({ error: 'Failed to fetch relationship types' });
  }
});

// ============================================
// Health Check
// ============================================

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await driver.verifyConnectivity();
    res.json({ status: 'healthy', neo4j: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', neo4j: 'disconnected' });
  }
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function main(): Promise<void> {
  await initNeo4j();
  app.listen(PORT, () => {
    console.log(`Starbase EASM API server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);

// Cleanup on exit
process.on('SIGINT', async () => {
  await driver?.close();
  process.exit(0);
});
