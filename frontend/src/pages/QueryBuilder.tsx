import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PlayIcon, DocumentTextIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { executeQuery, fetchQueryTemplates } from '../services/api';

export default function QueryBuilder() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);

  // Fetch query templates
  const { data: templates } = useQuery({
    queryKey: ['queryTemplates'],
    queryFn: fetchQueryTemplates,
  });

  // Execute query mutation
  const executeMutation = useMutation({
    mutationFn: executeQuery,
    onSuccess: (data) => {
      setResults(data);
      toast.success(`Query returned ${data.length} results`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Query execution failed');
      setResults(null);
    },
  });

  const handleExecute = () => {
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }
    executeMutation.mutate(query);
  };

  const handleTemplateSelect = (templateQuery: string) => {
    setQuery(templateQuery);
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(query);
    toast.success('Query copied to clipboard');
  };

  const copyResults = () => {
    if (results) {
      navigator.clipboard.writeText(JSON.stringify(results, null, 2));
      toast.success('Results copied to clipboard');
    }
  };

  // Render result value
  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.length > 3
          ? `[${value.slice(0, 3).join(', ')}... +${value.length - 3}]`
          : `[${value.join(', ')}]`;
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Query Builder</h1>
        <p className="text-sm text-gray-500">
          Write and execute Cypher queries against your Neo4j database
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Templates sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Query Templates</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[calc(100vh-20rem)] overflow-auto">
              {templates?.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleTemplateSelect(template.query)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50"
                >
                  <div className="flex items-start">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Query editor and results */}
        <div className="lg:col-span-3 space-y-6">
          {/* Query editor */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Cypher Query</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyQuery}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                  title="Copy query"
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleExecute}
                  disabled={executeMutation.isPending || !query.trim()}
                  className="flex items-center px-4 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayIcon className="w-4 h-4 mr-1" />
                  {executeMutation.isPending ? 'Running...' : 'Run Query'}
                </button>
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`// Enter your Cypher query here
// Example:
MATCH (n:Vulnerability)
WHERE n.severity = 'critical'
RETURN n.name, n.cveIds, n.cvssScore
LIMIT 10`}
                className="w-full h-48 px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                spellCheck={false}
              />
              <p className="mt-2 text-xs text-gray-500">
                Note: Only read queries are allowed. CREATE, DELETE, MERGE, SET, and REMOVE are
                disabled.
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Results {results && `(${results.length} rows)`}
              </h2>
              {results && results.length > 0 && (
                <button
                  onClick={copyResults}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                  title="Copy results as JSON"
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="p-4">
              {executeMutation.isPending ? (
                <div className="text-center py-8 text-gray-500">Executing query...</div>
              ) : results === null ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Run a query to see results</p>
                  <p className="text-xs mt-1">Select a template or write your own Cypher query</p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Query returned no results
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(results[0]).map((key) => (
                          <th
                            key={key}
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.slice(0, 100).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          {Object.values(row).map((value, colIndex) => (
                            <td
                              key={colIndex}
                              className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap max-w-xs truncate"
                              title={renderValue(value)}
                            >
                              {renderValue(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {results.length > 100 && (
                    <p className="text-center py-2 text-sm text-gray-500">
                      Showing first 100 of {results.length} results
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Query tips */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Query Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Use <code className="bg-blue-100 px-1 rounded">MATCH (n:Vulnerability)</code> to
                find nodes by class
              </li>
              <li>
                • Filter by type:{' '}
                <code className="bg-blue-100 px-1 rounded">WHERE n._type = 'bitsight_finding'</code>
              </li>
              <li>
                • Find relationships:{' '}
                <code className="bg-blue-100 px-1 rounded">MATCH (a)-[r]-{'>'}(b) RETURN a, r, b</code>
              </li>
              <li>
                • Count entities:{' '}
                <code className="bg-blue-100 px-1 rounded">MATCH (n) RETURN labels(n), count(n)</code>
              </li>
              <li>
                • Use <code className="bg-blue-100 px-1 rounded">LIMIT</code> to restrict results
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
