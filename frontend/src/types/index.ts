// Entity types
export interface Entity {
  id: string;
  type: string;
  class: string;
  name: string;
  displayName?: string;
  severity?: Severity;
  status?: string;
  firstSeen?: string;
  lastSeen?: string;
  properties?: Record<string, unknown>;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

// Graph types
export interface GraphNode {
  id: string;
  type: string;
  class: string;
  label: string;
  severity?: Severity;
  properties?: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Relationship types
export interface Relationship {
  direction: 'incoming' | 'outgoing';
  type: string;
  sourceId?: string;
  sourceType?: string;
  sourceName?: string;
  targetId?: string;
  targetType?: string;
  targetName?: string;
}

// Dashboard types
export interface EntityCount {
  label: string;
  count: number;
}

export interface RelationshipCount {
  type: string;
  count: number;
}

export interface SeverityCount {
  severity: Severity;
  count: number;
}

export interface DashboardStats {
  entityCounts: EntityCount[];
  relationshipCounts: RelationshipCount[];
  severityCounts: SeverityCount[];
}

export interface RecentFinding {
  type: string;
  name: string;
  severity: Severity;
  discoveredOn: string;
  key: string;
}

// Query types
export interface QueryTemplate {
  name: string;
  description: string;
  query: string;
}

// API response types
export interface SearchResponse {
  entities: Entity[];
  total: number;
  limit: number;
  offset: number;
}

export interface EntityDetailResponse {
  entity: Record<string, unknown>;
  relationships: Relationship[];
}

export interface EntityType {
  type: string;
  class: string;
  count: number;
}
