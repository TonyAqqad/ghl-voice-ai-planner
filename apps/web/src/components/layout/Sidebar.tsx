import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bot, 
  Workflow, 
  Phone, 
  Database, 
  Plug, 
  Shield, 
  ShieldAlert,
  TestTube, 
  BookOpen, 
  BarChart3, 
  Download,
  X,
  ExternalLink,
  Bug,
  Zap,
  Settings,
  AlertTriangle,
  Brain,
  Activity,
  Lightbulb,
  Rocket,
  Globe,
  Store,
  Webhook,
  Sparkles,
  Target,
  Users,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Heart,
  Mic,
  Cpu,
  Megaphone,
  MessageSquare,
  Gauge
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';

        const navigation = [
          { name: 'Expert Templates', href: '/template-importer', icon: Sparkles, description: 'Import F45, Gracie Barra, Restaurant', color: 'text-purple-500' },
          { name: 'Template Library', href: '/templates', icon: BookOpen, description: 'Browse all templates', color: 'text-indigo-400' },
          { name: 'Voice Agents', href: '/voice-agents', icon: Bot, description: 'Configure AI agents', color: 'text-blue-400' },
          { name: 'Voice Testing', href: '/voice-testing', icon: Mic, description: 'Test and preview voices', color: 'text-green-400' },
          { name: 'Agent Dashboard', href: '/agent-dashboard', icon: Activity, description: 'Monitor deployed agents', color: 'text-orange-400' },
          { name: 'Call Analytics', href: '/call-analytics', icon: BarChart3, description: 'Detailed call performance', color: 'text-cyan-400' },
          { name: 'Webhook Config', href: '/webhook-config', icon: Webhook, description: 'Manage webhooks', color: 'text-indigo-400' },
          { name: 'Advanced Agents', href: '/advanced-agents', icon: Bot, description: 'Industry-specific templates', color: 'text-purple-400' },
          { name: 'Automation Engine', href: '/automation', icon: Brain, description: 'AI-powered automation', color: 'text-orange-400' },
          { name: 'Live Monitoring', href: '/monitoring', icon: Activity, description: 'Real-time performance', color: 'text-green-400' },
          { name: 'Performance Monitor', href: '/performance', icon: Gauge, description: 'System performance metrics', color: 'text-blue-400' },
          { name: 'Governance Hub', href: '/governance', icon: ShieldAlert, description: 'Confidence, budgets, bundles', color: 'text-red-400' },
          { name: 'AI Optimization', href: '/optimization', icon: Lightbulb, description: 'AI-powered suggestions', color: 'text-yellow-400' },
          { name: 'Automated Testing', href: '/testing', icon: TestTube, description: 'Test & validation system', color: 'text-purple-400' },
          { name: 'One-Click Deploy', href: '/deployment', icon: Rocket, description: 'Deploy to any environment', color: 'text-orange-400' },
          { name: 'Conversation Analytics', href: '/analytics', icon: BarChart3, description: 'AI-powered conversation insights', color: 'text-purple-400' },
          { name: 'Optimization Engine', href: '/optimization-engine', icon: Zap, description: 'AI performance optimization', color: 'text-cyan-400' },
          { name: 'Multi-Language', href: '/languages', icon: Globe, description: 'Localization & translation', color: 'text-indigo-400' },
          { name: 'Security & Compliance', href: '/security', icon: Shield, description: 'Security monitoring & compliance', color: 'text-red-400' },
          { name: 'Agent Marketplace', href: '/marketplace', icon: Store, description: 'Discover & share agents', color: 'text-emerald-400' },
          { name: 'Webhook & API', href: '/webhook-api', icon: Webhook, description: 'Advanced webhook & API management', color: 'text-cyan-400' },
          { name: 'Training Hub', href: '/training', icon: BookOpen, description: 'Prompts, Knowledge, Q&A sync to GHL', color: 'text-emerald-400' },
          { name: 'Team Collaboration', href: '/team', icon: Users, description: 'Real-time team collaboration', color: 'text-indigo-400' },
          { name: 'Business Intelligence', href: '/business-intelligence', icon: BarChart3, description: 'Advanced reporting & analytics', color: 'text-purple-400' },
          { name: 'AI Template Generator', href: '/ai-template-generator', icon: Sparkles, description: 'AI-powered template generation', color: 'text-pink-400' },
          { name: 'GHL Validator', href: '/ghl-validator', icon: CheckCircle, description: 'Automated GHL integration testing', color: 'text-green-400' },
          { name: 'Cost Optimization', href: '/cost-optimization', icon: DollarSign, description: 'Intelligent cost management', color: 'text-yellow-400' },
          { name: 'A/B Testing', href: '/ab-testing', icon: TestTube, description: 'Advanced A/B testing framework', color: 'text-purple-400' },
          { name: 'Predictive Analytics', href: '/predictive-analytics', icon: TrendingUp, description: 'AI-powered forecasting', color: 'text-orange-400' },
          { name: 'Compliance Checker', href: '/compliance-checker', icon: Shield, description: 'Automated compliance monitoring', color: 'text-red-400' },
          { name: 'Performance Benchmarking', href: '/performance-benchmarking', icon: Target, description: 'Intelligent performance comparison', color: 'text-cyan-400' },
          { name: 'Workflow Orchestration', href: '/workflow-orchestration', icon: Workflow, description: 'Advanced automation & orchestration', color: 'text-purple-400' },
          { name: 'Sentiment Analysis', href: '/sentiment-analysis', icon: Heart, description: 'AI-powered emotion detection', color: 'text-pink-400' },
          { name: 'Agent Learning', href: '/agent-learning', icon: Brain, description: 'Intelligent learning & adaptation', color: 'text-purple-400' },
          { name: 'Voice Cloning', href: '/voice-cloning', icon: Mic, description: 'Advanced voice customization', color: 'text-cyan-400' },
          { name: 'ML Optimization', href: '/ml-optimization', icon: Cpu, description: 'Real-time ML optimization', color: 'text-orange-400' },
  { name: 'Deployer', href: '/deployer', icon: Zap, description: 'Deploy & manage agents', color: 'text-primary' },
  { name: 'Workflows', href: '/workflows', icon: Workflow, description: 'Design automation flows', color: 'text-purple-400' },
  { name: 'Traditional Workflows', href: '/traditional-workflows', icon: Settings, description: 'GHL native workflows', color: 'text-blue-400' },
  { name: 'AI Custom Actions', href: '/ai-custom-actions', icon: Bot, description: 'Real-time webhook actions', color: 'text-purple-400' },
  { name: 'Integration', href: '/workflow-integration', icon: Settings, description: 'Workflow integration tools', color: 'text-cyan-400' },
  { name: 'Phone System', href: '/phone-system', icon: Phone, description: 'Manage phone numbers & IVR', color: 'text-green-400' },
  { name: 'Custom Fields', href: '/custom-fields', icon: Database, description: 'Define custom data fields', color: 'text-orange-400' },
  { name: 'Integrations', href: '/integrations', icon: Plug, description: 'Connect external services', color: 'text-pink-400' },
  { name: 'GHL Helper', href: '/ghl-helper', icon: ExternalLink, description: 'GHL merge tags & patterns', color: 'text-cyan-400' },
  { name: 'Compliance', href: '/compliance', icon: Shield, description: 'Risk & compliance checker', color: 'text-red-400' },
  { name: 'Compliance & Safety', href: '/compliance-safety', icon: AlertTriangle, description: 'Regulatory compliance & safety', color: 'text-red-500' },
  { name: 'Testing', href: '/testing', icon: TestTube, description: 'Test your configurations', color: 'text-yellow-400' },
  { name: 'QA Golden Pack', href: '/qa-golden-pack', icon: Bug, description: 'Comprehensive testing framework', color: 'text-orange-400' },
  { name: 'Templates', href: '/templates', icon: BookOpen, description: 'Industry templates', color: 'text-indigo-400' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, description: 'Performance & costing', color: 'text-emerald-400' },
  { name: 'Export', href: '/export', icon: Download, description: 'Export configurations', color: 'text-violet-400' },
  // GHL-Specific Modules
  { name: 'GHL Voice Agents', href: '/ghl-voice-agents', icon: Bot, description: 'Build GHL-native Voice AI agents', color: 'text-blue-500' },
  { name: 'GHL Workflows', href: '/ghl-workflows', icon: Workflow, description: 'Create GHL workflow automations', color: 'text-purple-500' },
  { name: 'GHL API Connector', href: '/ghl-api', icon: Database, description: 'Connect to GHL API & sync data', color: 'text-green-500' },
  { name: 'GHL Contact Sync', href: '/ghl-contact-sync', icon: Users, description: 'Advanced contact synchronization', color: 'text-orange-500' },
  { name: 'SMS Messaging', href: '/sms-messaging', icon: MessageSquare, description: 'Send and manage SMS messages', color: 'text-blue-500' },
  { name: 'GHL Campaigns', href: '/ghl-campaigns', icon: Megaphone, description: 'Voice AI campaign management', color: 'text-pink-500' },
  { name: 'GHL Analytics', href: '/ghl-analytics', icon: BarChart3, description: 'Advanced analytics & reporting', color: 'text-cyan-500' },
      { name: 'GHL Deployer', href: '/ghl-deployer', icon: Rocket, description: 'Deploy & manage Voice AI agents', color: 'text-red-500' },
      { name: 'GHL Webhooks', href: '/ghl-webhooks', icon: Webhook, description: 'Monitor GHL webhook events', color: 'text-indigo-500' },
    ];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, darkMode } = useStore();

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-500 rounded-lg flex items-center justify-center glow">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground gradient-text">GHL Voice AI</h1>
                <p className="text-xs text-muted-foreground">Agent Planner</p>
              </div>
            </div>
            
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md hover:bg-accent transition-all duration-200 hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'group flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1'
                  )}
                >
                  <div className={clsx(
                    'w-5 h-5 flex-shrink-0 transition-colors duration-200',
                    isActive ? 'text-primary-foreground' : item.color
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate group-hover:text-primary transition-colors duration-200">
                      {item.name}
                    </div>
                    <div className="text-xs opacity-75 truncate group-hover:text-foreground transition-colors duration-200">
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-1 h-6 bg-primary-foreground rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>v1.0.0</span>
              <button
                onClick={() => useStore.getState().toggleDarkMode()}
                className="p-1 rounded hover:bg-accent"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
