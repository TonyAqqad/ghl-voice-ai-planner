import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
}

const items: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/training', label: 'Training Hub' },
  { to: '/voice-agents', label: 'Voice Agents' },
  { to: '/voice-testing', label: 'Voice Testing' },
];

const NavBar: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur animate-fade-in">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold gradient-text">
          <span>GHL Voice AI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {items.map((item) => {
            const active = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  'px-4 py-2 rounded-md transition-all relative',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                <span>{item.label}</span>
                {/* animated underline */}
                <span
                  className={[
                    'absolute left-3 right-3 -bottom-1 h-[2px] rounded',
                    active ? 'bg-primary scale-x-100' : 'bg-primary/60 scale-x-0 group-hover:scale-x-100',
                    'origin-left transition-transform duration-200 ease-out',
                  ].join(' ')}
                />
              </Link>
            );
          })}
        </nav>
        <div className="md:hidden">
          <span className="text-muted-foreground">≡</span>
        </div>
      </div>
    </header>
  );
};

export default NavBar;


