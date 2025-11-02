import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Settings, Zap, Star, TrendingUp, Clock, Users, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TemplateCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  count: number;
  description: string;
}

const AdvancedVoiceAgentBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: TemplateCategory[] = [
    { id: 'all', name: 'All Templates', icon: <Bot />, color: 'text-blue-500', count: 24, description: 'Browse all available templates' },
    { id: 'sales', name: 'Sales', icon: <TrendingUp />, color: 'text-green-500', count: 6, description: 'High-converting sales agents' },
    { id: 'support', name: 'Support', icon: <Users />, color: 'text-purple-500', count: 5, description: 'Customer support agents' },
    { id: 'appointments', name: 'Appointments', icon: <Clock />, color: 'text-orange-500', count: 4, description: 'Scheduling & booking agents' },
    { id: 'qualification', name: 'Lead Qualification', icon: <Award />, color: 'text-yellow-500', count: 3, description: 'Lead qualification agents' },
    { id: 'retention', name: 'Retention', icon: <Star />, color: 'text-pink-500', count: 3, description: 'Customer retention agents' },
    { id: 'healthcare', name: 'Healthcare', icon: <Users />, color: 'text-red-500', count: 3, description: 'Medical & healthcare agents' },
  ];

  const featuredTemplates = [
    { id: '1', name: 'Solar Sales Pro', industry: 'Sales', category: 'sales', rating: 4.9, downloads: 1247, difficulty: 'Intermediate', conversionRate: '12.5%' },
    { id: '2', name: 'Appointment Scheduler', industry: 'Scheduling', category: 'appointments', rating: 4.8, downloads: 892, difficulty: 'Beginner', conversionRate: '18.3%' },
    { id: '3', name: 'Customer Support Agent', industry: 'Support', category: 'support', rating: 4.7, downloads: 645, difficulty: 'Advanced', conversionRate: '95.2%' },
    { id: '4', name: 'Lead Qualification Master', industry: 'Sales', category: 'qualification', rating: 4.9, downloads: 1134, difficulty: 'Intermediate', conversionRate: '22.1%' },
    { id: '5', name: 'Patient Intake Specialist', industry: 'Healthcare', category: 'healthcare', rating: 4.8, downloads: 456, difficulty: 'Advanced', conversionRate: '88.7%' },
    { id: '6', name: 'Fitness Sales Agent', industry: 'Sales', category: 'sales', rating: 4.9, downloads: 2134, difficulty: 'Beginner', conversionRate: '14.6%' },
  ];

  const handleUseTemplate = (templateId: string) => {
    toast.success(`Opening template ${templateId}...`);
    navigate(`/ghl-voice-agents?template=${templateId}`);
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? featuredTemplates 
    : featuredTemplates.filter(t => t.category === selectedCategory);

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Advanced Voice Agent Builder</h1>
            <p className="text-muted-foreground">
              Industry-specific templates and advanced agent configurations
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`p-6 border rounded text-left hover:border-primary transition ${
              selectedCategory === category.id ? 'border-primary bg-primary/5' : ''
            }`}
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${category.color} bg-opacity-10`}>
              {category.icon}
            </div>
            <h3 className="font-semibold mb-1">{category.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
            <p className="text-xs text-muted-foreground">{category.count} templates</p>
          </button>
        ))}
      </div>

      {/* Featured Templates */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {selectedCategory === 'all' ? 'Featured Templates' : categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          <div className="text-sm text-muted-foreground">
            {filteredTemplates.length} templates available
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="card p-6 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-500 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.industry}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-semibold">{template.rating}</span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Downloads</span>
                <span className="font-semibold">{template.downloads.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Difficulty</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  template.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-500' :
                  template.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {template.difficulty}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Conversion Rate</span>
                <span className="font-semibold text-green-500">{template.conversionRate}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleUseTemplate(template.id)}
                className="flex-1 btn btn-primary"
              >
                <Zap className="w-4 h-4 mr-2" />
                Use Template
              </button>
              <button className="btn btn-outline">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="card p-12 text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            No templates match this category. Try selecting a different category.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdvancedVoiceAgentBuilder;