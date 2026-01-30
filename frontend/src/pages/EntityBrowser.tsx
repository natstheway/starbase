import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { searchEntities, fetchEntityTypes } from '../services/api';
import { getEntityIcon, getSeverityClass, parseEntityType, formatDate } from '../utils';
import type { Severity } from '../types';

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
const PAGE_SIZE = 25;

export default function EntityBrowser() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedSeverity, setSelectedSeverity] = useState(searchParams.get('severity') || '');
  const [currentPage, setCurrentPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch entity types for filter
  const { data: entityTypes } = useQuery({
    queryKey: ['entityTypes'],
    queryFn: fetchEntityTypes,
  });

  // Fetch entities
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['entities', searchQuery, selectedType, selectedSeverity, currentPage],
    queryFn: () =>
      searchEntities({
        q: searchQuery || undefined,
        type: selectedType || undefined,
        severity: selectedSeverity || undefined,
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
      }),
  });

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedType) params.set('type', selectedType);
    if (selectedSeverity) params.set('severity', selectedSeverity);
    setSearchParams(params);
  }, [searchQuery, selectedType, selectedSeverity, setSearchParams]);

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    refetch();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedSeverity('');
    setCurrentPage(0);
  };

  const hasActiveFilters = searchQuery || selectedType || selectedSeverity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entity Browser</h1>
          <p className="text-sm text-gray-500">
            Search and filter entities in your attack surface data
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {data?.total !== undefined && `${data.total.toLocaleString()} entities found`}
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSearch} className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, IP, domain..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
                showFilters || hasActiveFilters
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-primary-500 rounded-full" />
              )}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Search
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entity Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Types</option>
                    {entityTypes?.map((et) => (
                      <option key={et.type} value={et.type}>
                        {parseEntityType(et.type)} ({et.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => {
                      setSelectedSeverity(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Severities</option>
                    {SEVERITIES.map((severity) => (
                      <option key={severity} value={severity}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : data?.entities.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No entities found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      First Seen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.entities.map((entity) => (
                    <tr
                      key={entity.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => window.location.href = `/entities/${encodeURIComponent(entity.id)}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{getEntityIcon(entity.class)}</span>
                          <div>
                            <Link
                              to={`/entities/${encodeURIComponent(entity.id)}`}
                              className="text-sm font-medium text-gray-900 hover:text-primary-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {entity.displayName || entity.name || entity.id}
                            </Link>
                            <p className="text-xs text-gray-500 truncate max-w-xs" title={entity.id}>
                              {entity.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {parseEntityType(entity.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{entity.class}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entity.severity && (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSeverityClass(entity.severity)}`}
                          >
                            {entity.severity}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(entity.firstSeen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {currentPage * PAGE_SIZE + 1} to{' '}
                  {Math.min((currentPage + 1) * PAGE_SIZE, data?.total || 0)} of{' '}
                  {data?.total?.toLocaleString()} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
