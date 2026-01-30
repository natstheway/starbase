import axios from 'axios';
import type {
  DashboardStats,
  RecentFinding,
  GraphData,
  SearchResponse,
  EntityDetailResponse,
  EntityType,
  QueryTemplate,
  RelationshipCount,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Dashboard API
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard/stats');
  return data;
}

export async function fetchRecentFindings(): Promise<RecentFinding[]> {
  const { data } = await api.get<{ recentFindings: RecentFinding[] }>('/dashboard/recent');
  return data.recentFindings;
}

// Graph API
export async function fetchGraphData(params?: {
  entityTypes?: string[];
  limit?: number;
  search?: string;
}): Promise<GraphData> {
  const { data } = await api.get<GraphData>('/graph', {
    params: {
      entityTypes: params?.entityTypes?.join(','),
      limit: params?.limit,
      search: params?.search,
    },
  });
  return data;
}

export async function fetchNodeNeighbors(
  nodeId: string,
  depth: number = 1
): Promise<GraphData> {
  const { data } = await api.get<GraphData>(`/graph/neighbors/${encodeURIComponent(nodeId)}`, {
    params: { depth },
  });
  return data;
}

// Entity API
export async function fetchEntityTypes(): Promise<EntityType[]> {
  const { data } = await api.get<EntityType[]>('/entities/types');
  return data;
}

export async function searchEntities(params: {
  q?: string;
  type?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}): Promise<SearchResponse> {
  const { data } = await api.get<SearchResponse>('/entities/search', { params });
  return data;
}

export async function fetchEntityDetail(id: string): Promise<EntityDetailResponse> {
  const { data } = await api.get<EntityDetailResponse>(`/entities/${encodeURIComponent(id)}`);
  return data;
}

// Query API
export async function executeQuery(query: string): Promise<Record<string, unknown>[]> {
  const { data } = await api.post<{ result: Record<string, unknown>[] }>('/query', { query });
  return data.result;
}

export async function fetchQueryTemplates(): Promise<QueryTemplate[]> {
  const { data } = await api.get<QueryTemplate[]>('/query/templates');
  return data;
}

// Relationship API
export async function fetchRelationshipTypes(): Promise<RelationshipCount[]> {
  const { data } = await api.get<RelationshipCount[]>('/relationships/types');
  return data;
}

// Health API
export async function checkHealth(): Promise<{ status: string; neo4j: string }> {
  const { data } = await api.get<{ status: string; neo4j: string }>('/health');
  return data;
}
