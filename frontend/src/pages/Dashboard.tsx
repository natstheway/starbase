import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { fetchDashboardStats, fetchRecentFindings } from '../services/api';
import {
  formatNumber,
  formatRelativeTime,
  getSeverityBgColor,
  getEntityIcon,
  parseEntityType,
} from '../utils';
import type { Severity } from '../types';

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#f59e0b',
  low: '#84cc16',
  info: '#6b7280',
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });

  const { data: recentFindings, isLoading: findingsLoading } = useQuery({
    queryKey: ['recentFindings'],
    queryFn: fetchRecentFindings,
  });

  const totalEntities = stats?.entityCounts.reduce((sum, e) => sum + e.count, 0) || 0;
  const totalRelationships = stats?.relationshipCounts.reduce((sum, r) => sum + r.count, 0) || 0;
  const criticalCount = stats?.severityCounts.find((s) => s.severity === 'critical')?.count || 0;
  const highCount = stats?.severityCounts.find((s) => s.severity === 'high')?.count || 0;

  // Prepare chart data
  const topEntities = stats?.entityCounts.slice(0, 8) || [];
  const severityData = stats?.severityCounts.map((s) => ({
    name: s.severity.charAt(0).toUpperCase() + s.severity.slice(1),
    value: s.count,
    color: SEVERITY_COLORS[s.severity],
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attack Surface Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your external attack surface data from EASM integrations
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Entities</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {statsLoading ? '...' : formatNumber(totalEntities)}
          </div>
          <Link to="/entities" className="mt-2 text-sm text-primary-600 hover:text-primary-800">
            Browse entities →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Relationships</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {statsLoading ? '...' : formatNumber(totalRelationships)}
          </div>
          <Link to="/graph" className="mt-2 text-sm text-primary-600 hover:text-primary-800">
            Explore graph →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Critical Issues</div>
          <div className="mt-2 text-3xl font-bold text-red-600">
            {statsLoading ? '...' : formatNumber(criticalCount)}
          </div>
          <Link
            to="/entities?severity=critical"
            className="mt-2 text-sm text-primary-600 hover:text-primary-800"
          >
            View critical →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">High Severity</div>
          <div className="mt-2 text-3xl font-bold text-orange-600">
            {statsLoading ? '...' : formatNumber(highCount)}
          </div>
          <Link
            to="/entities?severity=high"
            className="mt-2 text-sm text-primary-600 hover:text-primary-800"
          >
            View high →
          </Link>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Entity types chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Entities by Type</h2>
          <div className="h-64">
            {statsLoading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEntities} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => parseEntityType(value).substring(0, 15)}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatNumber(value), 'Count']}
                    labelFormatter={(label) => parseEntityType(label)}
                  />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Severity distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Severity Distribution</h2>
          <div className="h-64">
            {statsLoading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading...
              </div>
            ) : severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatNumber(value), 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No severity data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent findings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Findings</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {findingsLoading ? (
            <div className="px-6 py-8 text-center text-gray-500">Loading...</div>
          ) : recentFindings && recentFindings.length > 0 ? (
            recentFindings.map((finding) => (
              <Link
                key={finding.key}
                to={`/entities/${encodeURIComponent(finding.key)}`}
                className="flex items-center px-6 py-4 hover:bg-gray-50"
              >
                <span className="text-2xl mr-4">{getEntityIcon('Finding')}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{finding.name}</p>
                  <p className="text-sm text-gray-500">{parseEntityType(finding.type)}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityBgColor(finding.severity)} text-white`}
                  >
                    {finding.severity}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatRelativeTime(finding.discoveredOn)}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent findings. Run your EASM integrations to populate data.
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/graph"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <span className="text-2xl mr-3">🔍</span>
            <div>
              <p className="font-medium text-gray-900">Explore Graph</p>
              <p className="text-sm text-gray-500">Visualize relationships</p>
            </div>
          </Link>

          <Link
            to="/entities?type=vulnerability"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <span className="text-2xl mr-3">🔓</span>
            <div>
              <p className="font-medium text-gray-900">Vulnerabilities</p>
              <p className="text-sm text-gray-500">View all vulnerabilities</p>
            </div>
          </Link>

          <Link
            to="/entities?type=domain"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <span className="text-2xl mr-3">🌐</span>
            <div>
              <p className="font-medium text-gray-900">Domains</p>
              <p className="text-sm text-gray-500">Browse discovered domains</p>
            </div>
          </Link>

          <Link
            to="/query"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <span className="text-2xl mr-3">💻</span>
            <div>
              <p className="font-medium text-gray-900">Query Builder</p>
              <p className="text-sm text-gray-500">Write custom queries</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
