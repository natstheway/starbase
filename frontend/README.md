# Starbase EASM Frontend

An interactive web-based frontend for visualizing and exploring External Attack Surface Management (EASM) data stored in Neo4j via Starbase.

## Features

### Dashboard
- Overview statistics of entities and relationships
- Severity distribution charts
- Recent findings and vulnerabilities
- Quick navigation to key sections

### Graph Explorer
- Interactive graph visualization using Cytoscape.js
- Pan, zoom, and explore relationships
- Filter by entity type
- Search for specific nodes
- Expand node neighbors with double-click
- Multiple layout options (force-directed, circle, grid, tree)

### Entity Browser
- Search and filter entities
- Filter by type, severity, and text search
- Paginated results table
- Quick links to entity details

### Entity Detail View
- Complete entity properties
- Timeline of dates
- Incoming and outgoing relationships
- One-click navigation to related entities

### Query Builder
- Write custom Cypher queries
- Pre-built query templates
- Tabular results display
- Copy query and results to clipboard

## Getting Started

### Prerequisites

- Node.js 18+
- Neo4j database with Starbase data
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
# or
yarn install
```

### Configuration

Set environment variables for the backend server:

```bash
# Neo4j connection (defaults shown)
export NEO4J_URI=bolt://localhost:7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=devpass
export NEO4J_DATABASE=neo4j
```

### Running

```bash
# Start both backend API server and frontend dev server
npm start
# or
yarn start

# Or run separately:
npm run server  # Backend API on port 4000
npm run dev     # Frontend on port 3000
```

Access the application at http://localhost:3000

## Architecture

```
frontend/
├── server/              # Express.js backend API
│   └── index.ts        # Neo4j connection and REST endpoints
├── src/
│   ├── components/     # Reusable React components
│   │   └── Layout.tsx  # Main layout with navigation
│   ├── pages/          # Page components
│   │   ├── Dashboard.tsx
│   │   ├── GraphExplorer.tsx
│   │   ├── EntityBrowser.tsx
│   │   ├── EntityDetail.tsx
│   │   └── QueryBuilder.tsx
│   ├── services/       # API client functions
│   │   └── api.ts
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/          # Utility functions
│   │   └── index.ts
│   ├── App.tsx         # Main app with routing
│   ├── main.tsx        # Entry point
│   └── index.css       # Tailwind CSS styles
├── package.json
├── vite.config.ts      # Vite configuration
└── tailwind.config.js  # Tailwind configuration
```

## API Endpoints

### Dashboard
- `GET /api/dashboard/stats` - Entity and relationship counts
- `GET /api/dashboard/recent` - Recent findings/vulnerabilities

### Graph
- `GET /api/graph` - Graph data for visualization
- `GET /api/graph/neighbors/:nodeId` - Neighbors of a node

### Entities
- `GET /api/entities/types` - All entity types with counts
- `GET /api/entities/search` - Search entities
- `GET /api/entities/:id` - Entity details with relationships

### Query
- `POST /api/query` - Execute Cypher query (read-only)
- `GET /api/query/templates` - Predefined query templates

### System
- `GET /api/health` - Health check

## Technologies

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Graph Visualization**: Cytoscape.js
- **Charts**: Recharts
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router
- **Backend**: Express.js, Neo4j Driver
- **Build**: Vite

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

## Keyboard Shortcuts

### Graph Explorer
- **Click** node: Select and view details
- **Double-click** node: Expand neighbors
- **Scroll**: Zoom in/out
- **Drag**: Pan the graph
- **Drag node**: Move node position

## Query Templates

The Query Builder includes templates for common queries:

1. **All Critical Vulnerabilities** - Find critical severity issues
2. **Exposed Services** - List open ports and services
3. **Domain Hierarchy** - Show domains and subdomains
4. **Assets by Country** - Group IPs by geography
5. **Expiring Certificates** - Find soon-to-expire certs
6. **Vulnerability by Asset** - Assets with most vulnerabilities
7. **Attack Surface Summary** - Overall entity counts
8. **High Severity Findings Path** - Trace paths to critical findings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and type checks
5. Submit a pull request

## License

MPL-2.0
