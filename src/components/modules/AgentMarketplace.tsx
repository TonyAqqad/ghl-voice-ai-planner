import React, { useState } from 'react';
import { Store, Download, Star, Eye, Heart, Share2, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AgentMarketplace: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const agents = [
    { id: '1', name: 'Sales Pro', downloads: 1234, rating: 4.8, category: 'Sales', price: 'Free', liked: false },
    { id: '2', name: 'Support Hero', downloads: 892, rating: 4.9, category: 'Support', price: '$49', liked: false },
    { id: '3', name: 'Lead Qualifier', downloads: 567, rating: 4.7, category: 'Sales', price: 'Free', liked: false },
  ];

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Agent Marketplace</h1>
            <p className="text-muted-foreground">Discover and share voice AI agents</p>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search agents..." className="w-full px-4 py-2 border rounded bg-background" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(agent => (
          <div key={agent.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">{agent.name}</h3>
              <button className="text-pink-600 hover:text-pink-700">
                <Heart className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{agent.category}</p>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm">{agent.rating}</span>
              </div>
              <span className="text-sm font-medium">{agent.price}</span>
            </div>
            <div className="flex space-x-2">
              <button className="btn btn-outline flex-1 btn-sm">
                <Eye className="w-4 h-4 mr-1" />Preview
              </button>
              <button onClick={() => toast.success('Agent installed')} className="btn btn-primary flex-1 btn-sm">
                <Download className="w-4 h-4 mr-1" />Install
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentMarketplace;
