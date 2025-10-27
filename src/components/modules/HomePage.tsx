import React from 'react';
import { ArrowRight, Play, Zap, Bot, Workflow, Phone, Database, Plug, Shield, TestTube, BookOpen, BarChart3, Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const features = [
    { name: 'Voice Agents', href: '/voice-agents', icon: Bot, description: 'Configure AI agents', color: 'text-blue-400' },
    { name: 'Workflows', href: '/workflows', icon: Workflow, description: 'Design automation flows', color: 'text-purple-400' },
    { name: 'Phone System', href: '/phone-system', icon: Phone, description: 'Manage phone numbers & IVR', color: 'text-green-400' },
    { name: 'Custom Fields', href: '/custom-fields', icon: Database, description: 'Define custom data fields', color: 'text-orange-400' },
    { name: 'Integrations', href: '/integrations', icon: Plug, description: 'Connect external services', color: 'text-pink-400' },
    { name: 'GHL Helper', href: '/ghl-helper', icon: ExternalLink, description: 'GHL merge tags & patterns', color: 'text-cyan-400' },
    { name: 'Compliance', href: '/compliance', icon: Shield, description: 'Risk & compliance checker', color: 'text-red-400' },
    { name: 'Testing', href: '/testing', icon: TestTube, description: 'Test your configurations', color: 'text-yellow-400' },
    { name: 'Templates', href: '/templates', icon: BookOpen, description: 'Industry templates', color: 'text-indigo-400' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, description: 'Performance & costing', color: 'text-emerald-400' },
    { name: 'Export', href: '/export', icon: Download, description: 'Export configurations', color: 'text-violet-400' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background opacity-50"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(85,102,255,0.1) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            {/* Main Headline */}
            <h1 className="text-6xl font-bold text-foreground mb-6">
              <span className="block">Voice AI agents</span>
              <span className="block gradient-text">for GoHighLevel</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              Build powerful, self-reliant AI agents that integrate seamlessly with GoHighLevel. 
              Create intelligent voice experiences that convert leads and delight customers.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                to="/voice-agents"
                className="btn btn-primary btn-lg flex items-center space-x-2 group"
              >
                <span>START BUILDING</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              
              <Link
                to="/templates"
                className="btn btn-outline btn-lg flex items-center space-x-2 group"
              >
                <span>BROWSE TEMPLATES</span>
                <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </Link>
            </div>
            
            {/* Audio Visualization */}
            <div className="audio-visualization mx-auto max-w-4xl mb-16">
              <div className="audio-bars">
                {Array.from({ length: 40 }, (_, i) => (
                  <div
                    key={i}
                    className="audio-bar"
                    style={{
                      height: `${Math.random() * 80 + 20}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              
              {/* Talk to VAPI Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="bg-white text-black px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center space-x-3">
                  <Play className="w-6 h-6" />
                  <span>TALK TO GHL AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Everything you need to build
          </h2>
          <p className="text-xl text-muted-foreground">
            Powerful tools for creating intelligent voice AI agents
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.name}
              to={feature.href}
              className="group card hover:shadow-xl transition-all duration-300 hover:-translate-y-2 glow-hover"
            >
              <div className="card-content">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                      {feature.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
                  <span>Explore</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Agents Built</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <div className="text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Availability</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">5min</div>
              <div className="text-muted-foreground">Setup Time</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to build your first agent?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of agencies already using our platform to create 
            powerful voice AI experiences for their GoHighLevel clients.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/voice-agents"
              className="btn btn-primary btn-lg flex items-center space-x-2 group"
            >
              <Zap className="w-5 h-5" />
              <span>GET STARTED NOW</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            
            <Link
              to="/templates"
              className="btn btn-outline btn-lg"
            >
              VIEW TEMPLATES
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
