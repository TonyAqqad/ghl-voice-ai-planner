import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bot, 
  Workflow, 
  Phone, 
  Database, 
  Plug, 
  Shield, 
  TestTube, 
  BookOpen, 
  BarChart3, 
  Settings,
  Sparkles,
  Radio,
  Activity,
  Zap
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';

const SidebarAdvanced: React.FC = () => {
  const location = useLocation();
  const { darkMode, toggleSidebar, sidebarOpen, voiceAgents } = useStore();
  const [stats, setStats] = useState({
    activeAgents: 0,
    totalCalls: 1247,
    avgSuccessRate: 89.3,
    isLive: true
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalCalls: prev.totalCalls + Math.floor(Math.random() * 3),
        avgSuccessRate: Math.min(95, prev.avgSuccessRate + (Math.random() - 0.5) * 0.5)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const coreNavigation = [
    { name: 'Expert Templates', href: '/template-importer', icon: Sparkles, badge: 'New' },
    { name: 'Voice Agents', href: '/voice-agents', icon: Bot, badge: voiceAgents.length.toString() },
    { name: 'Live Monitoring', href: '/monitoring', icon: Activity, badge: 'Live' },
    { name: 'Agent Dashboard', href: '/agent-dashboard', icon: BarChart3 },
    { name: 'Call Analytics', href: '/call-analytics', icon: BarChart3 },
    { name: 'Webhook Config', href: '/webhook-config', icon: Plug },
  ];

  const advancedNavigation = [
    { name: 'AI Optimization', href: '/optimization', icon: Zap },
    { name: 'Automation Engine', href: '/automation', icon: Workflow },
    { name: 'One-Click Deploy', href: '/deployment', icon: Settings },
    { name: 'Compliance & Safety', href: '/compliance', icon: Shield },
    { name: 'Voice Testing', href: '/voice-testing', icon: TestTube },
    { name: 'Template Library', href: '/templates', icon: BookOpen },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center space-x-3">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground">GHL Voice AI</h1>
                <p className="text-xs text-muted-foreground">Planner</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Stats Bar */}
      {sidebarOpen && (
        <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-purple-500/10">
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex items-center space-x-2">
              <Radio className="w-3 h-3 text-green-500 animate-pulse" />
              <span className="text-xs font-medium text-foreground">Live Metrics</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Active Agents</span>
              <span className="text-xs font-bold text-foreground">{stats.activeAgents}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Calls Today</span>
              <span className="text-xs font-bold text-foreground">{stats.totalCalls.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Success Rate</span>
              <span className="text-xs font-bold text-green-500">{stats.avgSuccessRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Core Navigation */}
      <div className="p-2">
        {!sidebarOpen && (
          <p className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase">Core</p>
        )}
        {sidebarOpen && (
          <p className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider">Core Modules</p>
        )}
        {coreNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={clsx(
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 group',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className={clsx('w-5 h-5 flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.name}</span>
                  {item.badge && (
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-bold',
                      item.badge === 'Live' ? 'bg-green-500/20 text-green-500' :
                      item.badge === 'New' ? 'bg-purple-500/20 text-purple-500' :
                      'bg-primary/20 text-primary'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>

      {/* Advanced Navigation */}
      <div className="p-2 pt-4 border-t border-border">
        {!sidebarOpen && (
          <p className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase">Advanced</p>
        )}
        {sidebarOpen && (
          <p className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider">Advanced Features</p>
        )}
        {advancedNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={clsx(
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 group',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className={clsx('w-5 h-5 flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SidebarAdvanced;

