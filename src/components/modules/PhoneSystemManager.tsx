import React, { useState } from 'react';
import { Phone, Plus, Settings, Trash2, Edit } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

const PhoneSystemManager: React.FC = () => {
  const { darkMode, phoneNumbers, addPhoneNumber } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    country: 'US',
    capabilities: ['voice', 'sms'],
    status: 'active' as const
  });

  const handleAddNumber = () => {
    if (!formData.number.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    const newNumber = {
      id: Date.now().toString(),
      ...formData,
      routingRules: []
    };

    addPhoneNumber(newNumber);
    toast.success('Phone number added successfully!');
    setIsAdding(false);
    setFormData({
      number: '',
      country: 'US',
      capabilities: ['voice', 'sms'],
      status: 'active'
    });
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Phone System Manager</h1>
            <p className="text-muted-foreground">
              Manage phone numbers, IVR menus, and call routing
            </p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Number</span>
          </button>
        </div>
      </div>

      {/* Add Number Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Add Phone Number</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNumber}
                  className="btn btn-primary"
                >
                  Add Number
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Numbers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {phoneNumbers.map((number) => (
          <div key={number.id} className="card p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{number.number}</h3>
                  <p className="text-sm text-muted-foreground">
                    {number.country} • {number.status}
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button className="p-2 hover:bg-accent rounded-md">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-accent rounded-md text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Capabilities:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {number.capabilities.map((cap) => (
                    <span key={cap} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Routing Rules:</span>
                <span className="ml-2">{number.routingRules.length}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="btn btn-outline btn-sm flex-1">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </button>
            </div>
          </div>
        ))}

        {phoneNumbers.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Phone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No phone numbers added yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first phone number to start receiving calls
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Number
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneSystemManager;