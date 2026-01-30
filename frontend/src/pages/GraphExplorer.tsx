import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import CytoscapeComponent from 'react-cytoscapejs';
import type { Core, ElementDefinition, Stylesheet } from 'cytoscape';
import { fetchGraphData, fetchNodeNeighbors, fetchEntityTypes } from '../services/api';
import { getNodeColor, parseEntityType } from '../utils';
import type { GraphNode, GraphEdge } from '../types';

// Cytoscape stylesheet
const cytoscapeStylesheet: Stylesheet[] = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'font-size': '10px',
      'text-margin-y': 5,
      'background-color': 'data(color)',
      width: 30,
      height: 30,
      'border-width': 2,
      'border-color': '#fff',
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 3,
      'border-color': '#0ea5e9',
      width: 40,
      height: 40,
    },
  },
  {
    selector: 'node.highlighted',
    style: {
      'border-width': 3,
      'border-color': '#f59e0b',
    },
  },
  {
    selector: 'edge',
    style: {
      width: 1,
      'line-color': '#94a3b8',
      'target-arrow-color': '#94a3b8',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      label: 'data(label)',
      'font-size': '8px',
      'text-rotation': 'autorotate',
      'text-margin-y': -10,
      color: '#64748b',
    },
  },
  {
    selector: 'edge:selected',
    style: {
      width: 2,
      'line-color': '#0ea5e9',
      'target-arrow-color': '#0ea5e9',
    },
  },
];

export default function GraphExplorer() {
  const navigate = useNavigate();
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [nodeLimit, setNodeLimit] = useState(100);
  const [expandDepth, setExpandDepth] = useState(1);

  // Fetch entity types for filter
  const { data: entityTypes } = useQuery({
    queryKey: ['entityTypes'],
    queryFn: fetchEntityTypes,
  });

  // Fetch graph data
  const { data: graphData, isLoading, refetch } = useQuery({
    queryKey: ['graphData', selectedTypes, nodeLimit, searchQuery],
    queryFn: () =>
      fetchGraphData({
        entityTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
        limit: nodeLimit,
        search: searchQuery || undefined,
      }),
  });

  // Convert graph data to Cytoscape elements
  const elements: ElementDefinition[] = [
    ...(graphData?.nodes || []).map((node: GraphNode) => ({
      data: {
        id: node.id,
        label: node.label.length > 20 ? node.label.substring(0, 20) + '...' : node.label,
        fullLabel: node.label,
        type: node.type,
        class: node.class,
        severity: node.severity,
        color: getNodeColor(node.class),
        properties: node.properties,
      },
    })),
    ...(graphData?.edges || []).map((edge: GraphEdge) => ({
      data: {
        id: `${edge.source}-${edge.type}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        label: edge.type.replace(/_/g, ' ').toLowerCase(),
      },
    })),
  ];

  // Handle node click
  const handleNodeClick = useCallback((nodeData: GraphNode) => {
    setSelectedNode(nodeData);
  }, []);

  // Handle node double-click to expand
  const handleNodeDoubleClick = useCallback(
    async (nodeId: string) => {
      try {
        const neighbors = await fetchNodeNeighbors(nodeId, expandDepth);
        if (cyRef.current && neighbors.nodes.length > 0) {
          // Add new nodes
          const existingIds = new Set(
            cyRef.current.nodes().map((n) => n.id())
          );

          const newNodes = neighbors.nodes
            .filter((n) => !existingIds.has(n.id))
            .map((node) => ({
              data: {
                id: node.id,
                label: node.label.length > 20 ? node.label.substring(0, 20) + '...' : node.label,
                fullLabel: node.label,
                type: node.type,
                class: node.class,
                severity: node.severity,
                color: getNodeColor(node.class),
                properties: node.properties,
              },
            }));

          const newEdges = neighbors.edges
            .filter((e) => !cyRef.current?.getElementById(`${e.source}-${e.type}-${e.target}`).length)
            .map((edge) => ({
              data: {
                id: `${edge.source}-${edge.type}-${edge.target}`,
                source: edge.source,
                target: edge.target,
                label: edge.type.replace(/_/g, ' ').toLowerCase(),
              },
            }));

          cyRef.current.add([...newNodes, ...newEdges]);
          cyRef.current.layout({ name: 'cose', animate: true }).run();
        }
      } catch (error) {
        console.error('Failed to expand node:', error);
      }
    },
    [expandDepth]
  );

  // Initialize Cytoscape event handlers
  useEffect(() => {
    if (cyRef.current) {
      const cy = cyRef.current;

      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        handleNodeClick({
          id: node.id(),
          type: node.data('type'),
          class: node.data('class'),
          label: node.data('fullLabel'),
          severity: node.data('severity'),
          properties: node.data('properties'),
        });
      });

      cy.on('dbltap', 'node', (evt) => {
        handleNodeDoubleClick(evt.target.id());
      });

      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          setSelectedNode(null);
        }
      });

      // Run initial layout
      cy.layout({ name: 'cose', animate: false }).run();
    }
  }, [handleNodeClick, handleNodeDoubleClick, elements.length]);

  // Toggle type filter
  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Fit graph to viewport
  const fitGraph = () => {
    cyRef.current?.fit();
  };

  // Reset zoom
  const resetZoom = () => {
    cyRef.current?.zoom(1);
    cyRef.current?.center();
  };

  // Run layout
  const runLayout = (layoutName: string) => {
    cyRef.current?.layout({ name: layoutName, animate: true }).run();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Graph Explorer</h1>
          <p className="text-sm text-gray-500">
            Visualize and explore relationships in your attack surface data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {graphData?.nodes.length || 0} nodes, {graphData?.edges.length || 0} edges
          </span>
        </div>
      </div>

      <div className="flex-1 flex gap-4">
        {/* Sidebar */}
        <div className="w-64 flex flex-col space-y-4">
          {/* Search */}
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={() => refetch()}
              className="mt-2 w-full px-3 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
            >
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 flex-1 overflow-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">Entity Types</label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {entityTypes?.slice(0, 15).map((et) => (
                <label key={et.type} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(et.type)}
                    onChange={() => toggleTypeFilter(et.type)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                  />
                  <span className="truncate" title={et.type}>
                    {parseEntityType(et.type)}
                  </span>
                  <span className="ml-auto text-gray-400">({et.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Node Limit: {nodeLimit}
            </label>
            <input
              type="range"
              min={50}
              max={500}
              step={50}
              value={nodeLimit}
              onChange={(e) => setNodeLimit(parseInt(e.target.value, 10))}
              className="w-full"
            />

            <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
              Expand Depth: {expandDepth}
            </label>
            <input
              type="range"
              min={1}
              max={3}
              value={expandDepth}
              onChange={(e) => setExpandDepth(parseInt(e.target.value, 10))}
              className="w-full"
            />
          </div>

          {/* Layout controls */}
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => runLayout('cose')}
                className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                Force
              </button>
              <button
                onClick={() => runLayout('circle')}
                className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                Circle
              </button>
              <button
                onClick={() => runLayout('grid')}
                className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                Grid
              </button>
              <button
                onClick={() => runLayout('breadthfirst')}
                className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                Tree
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={fitGraph}
                className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
              >
                Fit
              </button>
              <button
                onClick={resetZoom}
                className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Graph area */}
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-gray-500">Loading graph data...</div>
            </div>
          ) : elements.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-gray-500 mb-2">No data to display</div>
                <p className="text-sm text-gray-400">
                  Run your EASM integrations to populate the graph
                </p>
              </div>
            </div>
          ) : (
            <CytoscapeComponent
              elements={elements}
              stylesheet={cytoscapeStylesheet}
              style={{ width: '100%', height: '100%' }}
              cy={(cy) => {
                cyRef.current = cy;
              }}
              wheelSensitivity={0.2}
            />
          )}

          {/* Instructions overlay */}
          <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg px-3 py-2 text-xs text-gray-600 shadow">
            <p>
              <strong>Click</strong> node to select •{' '}
              <strong>Double-click</strong> to expand •{' '}
              <strong>Scroll</strong> to zoom
            </p>
          </div>
        </div>

        {/* Node details panel */}
        {selectedNode && (
          <div className="w-72 bg-white rounded-lg shadow p-4 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Node Details</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Name</label>
                <p className="text-sm text-gray-900 break-words">{selectedNode.label}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">Type</label>
                <p className="text-sm text-gray-900">{parseEntityType(selectedNode.type)}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">Class</label>
                <p className="text-sm text-gray-900">{selectedNode.class}</p>
              </div>

              {selectedNode.severity && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Severity</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedNode.severity}</p>
                </div>
              )}

              <button
                onClick={() => navigate(`/entities/${encodeURIComponent(selectedNode.id)}`)}
                className="w-full mt-4 px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
              >
                View Full Details
              </button>

              <button
                onClick={() => handleNodeDoubleClick(selectedNode.id)}
                className="w-full px-4 py-2 border border-primary-600 text-primary-600 text-sm rounded-md hover:bg-primary-50"
              >
                Expand Neighbors
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
