import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  
  // Map routes to readable labels
  const routeLabels: Record<string, string> = {
    '/': 'Home',
    '/voice-agents': 'Voice Agents',
    '/voice-testing': 'Voice Testing',
    '/agent-dashboard': 'Agent Dashboard',
    '/call-analytics': 'Call Analytics',
    '/webhook-config': 'Webhook Config',
    '/template-importer': 'Expert Templates',
    '/templates': 'Template Library',
  };

  const paths = location.pathname.split('/').filter(Boolean);
  
  if (paths.length === 0) return null;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    ...paths.map((path, index) => ({
      label: routeLabels[`/${paths.slice(0, index + 1).join('/')}`] || path,
      href: `/${paths.slice(0, index + 1).join('/')}`,
    })),
  ];

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index === 0 ? (
            <Link
              to={crumb.href}
              className="hover:text-foreground transition-colors flex items-center"
            >
              <Home className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <ChevronRight className="w-4 h-4" />
              {index === breadcrumbs.length - 1 ? (
                <span className="text-foreground font-medium">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;

