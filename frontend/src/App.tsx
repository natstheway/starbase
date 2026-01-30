import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import GraphExplorer from './pages/GraphExplorer';
import EntityBrowser from './pages/EntityBrowser';
import EntityDetail from './pages/EntityDetail';
import QueryBuilder from './pages/QueryBuilder';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/graph" element={<GraphExplorer />} />
        <Route path="/entities" element={<EntityBrowser />} />
        <Route path="/entities/:id" element={<EntityDetail />} />
        <Route path="/query" element={<QueryBuilder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
