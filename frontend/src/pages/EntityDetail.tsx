import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { fetchEntityDetail } from '../services/api';
import {
  getEntityIcon,
  getSeverityClass,
  parseEntityType,
  formatDate,
  camelToTitle,
} from '../utils';

export default function EntityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['entityDetail', id],
    queryFn: () => fetchEntityDetail(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading entity details...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">Entity not found or failed to load</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-primary-600 hover:text-primary-800"
        >
          Go back
        </button>
      </div>
    );
  }

  const { entity, relationships } = data;
  const entityClass = entity._class as string;
  const entityType = entity._type as string;
  const severity = entity.severity as string | undefined;

  // Group properties by category
  const coreProperties = ['_key', '_type', '_class', 'name', 'displayName'];
  const dateProperties = Object.keys(entity).filter(
    (key) =>
      key.toLowerCase().includes('date') ||
      key.toLowerCase().includes('time') ||
      key.toLowerCase().includes('seen') ||
      key.toLowerCase().includes('created') ||
      key.toLowerCase().includes('updated') ||
      key.toLowerCase().includes('on')
  );
  const arrayProperties = Object.entries(entity).filter(
    ([, value]) => Array.isArray(value)
  );
  const otherProperties = Object.entries(entity).filter(
    ([key, value]) =>
      !coreProperties.includes(key) &&
      !dateProperties.includes(key) &&
      !Array.isArray(value) &&
      value !== null &&
      value !== undefined &&
      !key.startsWith('_')
  );

  // Separate incoming and outgoing relationships
  const incomingRelations = relationships.filter((r) => r.direction === 'incoming');
  const outgoingRelations = relationships.filter((r) => r.direction === 'outgoing');

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{getEntityIcon(entityClass)}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {(entity.displayName as string) || (entity.name as string) || id}
              </h1>
              <p className="text-sm text-gray-500">
                {parseEntityType(entityType)} • {entityClass}
              </p>
            </div>
          </div>
        </div>
        {severity && (
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full border ${getSeverityClass(severity)}`}
          >
            {severity}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Core information */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Core Information</h2>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Entity Key</dt>
                  <dd className="mt-1 text-sm text-gray-900 break-all font-mono">
                    {entity._key as string}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Entity Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {parseEntityType(entityType)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Entity Class</dt>
                  <dd className="mt-1 text-sm text-gray-900">{entityClass}</dd>
                </div>
                {entity.status && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">{entity.status as string}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Other properties */}
          {otherProperties.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {otherProperties.map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm font-medium text-gray-500">
                        {camelToTitle(key)}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 break-words">
                        {typeof value === 'boolean'
                          ? value
                            ? 'Yes'
                            : 'No'
                          : typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}

          {/* Date properties */}
          {dateProperties.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dateProperties.map((key) => (
                    <div key={key}>
                      <dt className="text-sm font-medium text-gray-500">
                        {camelToTitle(key)}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(entity[key] as string)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}

          {/* Array properties */}
          {arrayProperties.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Lists</h2>
              </div>
              <div className="p-6 space-y-4">
                {arrayProperties.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm font-medium text-gray-500 mb-2">
                      {camelToTitle(key)} ({(value as unknown[]).length})
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {(value as unknown[]).slice(0, 20).map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                        </span>
                      ))}
                      {(value as unknown[]).length > 20 && (
                        <span className="text-xs text-gray-500">
                          +{(value as unknown[]).length - 20} more
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar with relationships */}
        <div className="space-y-6">
          {/* Outgoing relationships */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Outgoing ({outgoingRelations.length})
              </h2>
              <p className="text-xs text-gray-500">This entity → Others</p>
            </div>
            <div className="divide-y divide-gray-200 max-h-80 overflow-auto">
              {outgoingRelations.length === 0 ? (
                <div className="px-6 py-4 text-sm text-gray-500">
                  No outgoing relationships
                </div>
              ) : (
                outgoingRelations.map((rel, index) => (
                  <Link
                    key={index}
                    to={`/entities/${encodeURIComponent(rel.targetId!)}`}
                    className="flex items-center px-6 py-3 hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {rel.targetName || rel.targetId}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="text-primary-600">{rel.type.replace(/_/g, ' ')}</span>
                        {' → '}
                        {parseEntityType(rel.targetType || '')}
                      </p>
                    </div>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Incoming relationships */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Incoming ({incomingRelations.length})
              </h2>
              <p className="text-xs text-gray-500">Others → This entity</p>
            </div>
            <div className="divide-y divide-gray-200 max-h-80 overflow-auto">
              {incomingRelations.length === 0 ? (
                <div className="px-6 py-4 text-sm text-gray-500">
                  No incoming relationships
                </div>
              ) : (
                incomingRelations.map((rel, index) => (
                  <Link
                    key={index}
                    to={`/entities/${encodeURIComponent(rel.sourceId!)}`}
                    className="flex items-center px-6 py-3 hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {rel.sourceName || rel.sourceId}
                      </p>
                      <p className="text-xs text-gray-500">
                        {parseEntityType(rel.sourceType || '')}
                        {' → '}
                        <span className="text-primary-600">{rel.type.replace(/_/g, ' ')}</span>
                      </p>
                    </div>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Actions</h3>
            <div className="space-y-2">
              <Link
                to={`/graph?search=${encodeURIComponent(entity.name as string || id!)}`}
                className="block w-full px-4 py-2 text-center text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                View in Graph
              </Link>
              <button
                onClick={() => navigator.clipboard.writeText(entity._key as string)}
                className="block w-full px-4 py-2 text-center text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Copy Entity Key
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
