import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames';
import {
  HomeIcon,
  CircleStackIcon,
  MagnifyingGlassIcon,
  CommandLineIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { checkHealth } from '../services/api';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Graph Explorer', href: '/graph', icon: CircleStackIcon },
  { name: 'Entity Browser', href: '/entities', icon: MagnifyingGlassIcon },
  { name: 'Query Builder', href: '/query', icon: CommandLineIcon },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: 30000,
  });

  const isConnected = health?.status === 'healthy';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={classNames(
          'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
          <span className="text-xl font-bold text-white">Starbase EASM</span>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-4 px-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={classNames(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg',
                location.pathname === item.href
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gray-900">
          <div className="flex items-center h-16 px-4 bg-gray-800">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-primary-500" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="50" cy="50" r="45" opacity="0.2" />
                <circle cx="50" cy="50" r="8" />
                <circle cx="25" cy="35" r="6" />
                <circle cx="75" cy="35" r="6" />
                <circle cx="30" cy="70" r="6" />
                <circle cx="70" cy="70" r="6" />
                <line x1="50" y1="50" x2="25" y2="35" stroke="currentColor" strokeWidth="2" />
                <line x1="50" y1="50" x2="75" y2="35" stroke="currentColor" strokeWidth="2" />
                <line x1="50" y1="50" x2="30" y2="70" stroke="currentColor" strokeWidth="2" />
                <line x1="50" y1="50" x2="70" y2="70" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="ml-2 text-xl font-bold text-white">Starbase EASM</span>
            </div>
          </div>

          <nav className="flex-1 mt-4 px-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={classNames(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  location.pathname === item.href
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Connection status */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center">
              <div
                className={classNames(
                  'w-2 h-2 rounded-full mr-2',
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                )}
              />
              <span className="text-sm text-gray-400">
                Neo4j: {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b border-gray-200 lg:hidden">
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <span className="ml-4 text-lg font-semibold text-gray-900">Starbase EASM</span>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
