import React, { useState } from 'react';
import { 
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Star,
  Users,
  Stethoscope,
  Building2,
  Utensils,
  Calendar,
  Headphones
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  industry: string;
  rating: number;
  downloads: number;
  icon: React.ElementType;
  preview: string;
}

const TemplateLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showPreview, setShowPreview] = useState<Template | null>(null);

  const templates: Template[] = [
    {
      id: 'tpl_1',
      name: 'Sales Lead Qualification',
      category: 'Sales',
      description: 'High-converting lead qualification agent for sales teams',
      industry: 'General Business',
      rating: 4.8,
      downloads: 1234,
      icon: Users,
      preview: 'This template helps qualify sales leads with automated questions...'
    },
    {
      id: 'tpl_2',
      name: 'Appointment Scheduling',
      category: 'Booking',
      description: 'Automated appointment scheduling with calendar integration',
      industry: 'Service Business',
      rating: 4.9,
      downloads: 892,
      icon: Calendar,
      preview: 'Schedule appointments with natural conversation flow...'
    },
    {
      id: 'tpl_3',
      name: 'Customer Support',
      category: 'Support',
      description: 'AI-powered customer support agent with ticket creation',
      industry: 'General Business',
      rating: 4.7,
      downloads: 1567,
      icon: Headphones,
      preview: 'Handle common support inquiries efficiently...'
    },
    {
      id: 'tpl_4',
      name: 'Healthcare Intake',
      category: 'Healthcare',
      description: 'HIPAA-compliant patient intake and information gathering',
      industry: 'Healthcare',
      rating: 5.0,
      downloads: 456,
      icon: Stethoscope,
      preview: 'Compliant patient data collection...'
    },
    {
      id: 'tpl_5',
      name: 'Real Estate Listing',
      category: 'Real Estate',
      description: 'Property information and agent referral system',
      industry: 'Real Estate',
      rating: 4.6,
      downloads: 678,
      icon: Building2,
      preview: 'Qualify leads and schedule property viewings...'
    },
    {
      id: 'tpl_6',
      name: 'Restaurant Reservations',
      category: 'Hospitality',
      description: 'Table booking and reservation management',
      industry: 'Restaurant',
      rating: 4.5,
      downloads: 789,
      icon: Utensils,
      preview: 'Manage restaurant reservations seamlessly...'
    }
  ];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: Template) => {
    toast.success(`Using template: ${template.name}`);
    // Create agent from template logic here
  };

  const categories = ['all', 'Sales', 'Booking', 'Support', 'Healthcare', 'Real Estate', 'Hospitality'];

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Template Library</h1>
            <p className="text-muted-foreground">
              Pre-built industry-specific voice agent templates
            </p>
          </div>
          <button className="btn btn-primary">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium">Search Templates</label>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description..."
              className="w-full px-4 py-2 border rounded bg-background"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium">Category</label>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded bg-background"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="card p-6 hover:shadow-lg transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <template.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-xs text-muted-foreground">{template.category}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">{template.rating}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {template.description}
            </p>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Download className="w-4 h-4" />
                <span>{template.downloads.toLocaleString()} uses</span>
              </div>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary">
                {template.industry}
              </span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowPreview(template)}
                className="btn btn-outline flex-1 btn-sm"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </button>
              <button
                onClick={() => handleUseTemplate(template)}
                className="btn btn-primary flex-1 btn-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Use
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-semibold mb-4">Template Preview</h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">{showPreview.name}</h3>
              <p className="text-muted-foreground mb-4">{showPreview.preview}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <span className="ml-2 font-medium">{showPreview.category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rating:</span>
                  <span className="ml-2 font-medium">{showPreview.rating}/5.0</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Industry:</span>
                  <span className="ml-2 font-medium">{showPreview.industry}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Downloads:</span>
                  <span className="ml-2 font-medium">{showPreview.downloads.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPreview(null)}
                className="btn btn-outline flex-1"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleUseTemplate(showPreview);
                  setShowPreview(null);
                }}
                className="btn btn-primary flex-1"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
