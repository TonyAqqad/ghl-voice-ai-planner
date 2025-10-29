import React, { useState } from 'react';
import { 
  Database, 
  Plus, 
  Edit3, 
  Trash2, 
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  Building
} from 'lucide-react';
import { useStore, CustomField } from '../../store/useStore';
import { toast } from 'react-hot-toast';

const CustomFieldsManager: React.FC = () => {
  const { customFields, addCustomField, updateCustomField, deleteCustomField } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<'contact' | 'opportunity' | 'company' | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);

  const [formData, setFormData] = useState({
    entity: 'contact' as 'contact' | 'opportunity' | 'company',
    fieldKey: '',
    label: '',
    type: 'text' as 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect',
    required: false,
    options: [] as string[]
  });

  const filteredFields = customFields.filter(field => {
    const matchesSearch = field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.fieldKey.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntity = entityFilter === 'all' || field.entity === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fieldKey || !formData.label) {
      toast.error('Please fill in required fields');
      return;
    }

    const fieldData: CustomField = {
      id: editingField?.id || `field_${Date.now()}`,
      entity: formData.entity,
      fieldKey: formData.fieldKey,
      label: formData.label,
      type: formData.type,
      required: formData.required,
      options: formData.options,
      defaultValue: undefined
    };

    if (editingField) {
      updateCustomField(editingField.id, fieldData);
      toast.success('Field updated successfully');
    } else {
      addCustomField(fieldData);
      toast.success('Field created successfully');
    }

    setShowAddModal(false);
    setEditingField(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      entity: 'contact',
      fieldKey: '',
      label: '',
      type: 'text',
      required: false,
      options: []
    });
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      entity: field.entity,
      fieldKey: field.fieldKey,
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options || []
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this field?')) {
      deleteCustomField(id);
      toast.success('Field deleted');
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Custom Fields Manager</h1>
            <p className="text-muted-foreground">
              Define and manage custom data fields for contacts, opportunities, and companies
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingField(null);
              setShowAddModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium">Search Fields</label>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by label or key..."
              className="w-full px-4 py-2 border rounded bg-background"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium">Filter by Entity</label>
            </div>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value as any)}
              className="w-full px-4 py-2 border rounded bg-background"
            >
              <option value="all">All Entities</option>
              <option value="contact">Contacts</option>
              <option value="opportunity">Opportunities</option>
              <option value="company">Companies</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fields List */}
      <div className="card p-6">
        {filteredFields.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No custom fields yet</p>
            <p className="text-sm text-muted-foreground">Create your first custom field to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFields.map((field) => (
              <div key={field.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {field.entity === 'contact' && <Users className="w-5 h-5 text-blue-600" />}
                      {field.entity === 'opportunity' && <FileText className="w-5 h-5 text-green-600" />}
                      {field.entity === 'company' && <Building className="w-5 h-5 text-purple-600" />}
                      <h3 className="text-lg font-semibold">{field.label}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {field.entity}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary">
                        {field.type}
                      </span>
                      {field.required && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Key: <code>{field.fieldKey}</code></p>
                    {field.options && field.options.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Options: {field.options.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(field)}
                      className="btn btn-outline btn-sm"
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(field.id)}
                      className="btn btn-outline btn-sm text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4">
              {editingField ? 'Edit Field' : 'Add Custom Field'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Entity</label>
                  <select
                    value={formData.entity}
                    onChange={(e) => setFormData({ ...formData, entity: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded bg-background"
                    required
                  >
                    <option value="contact">Contact</option>
                    <option value="opportunity">Opportunity</option>
                    <option value="company">Company</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Field Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded bg-background"
                    required
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="boolean">Boolean</option>
                    <option value="select">Select</option>
                    <option value="multiselect">Multi-Select</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Field Key</label>
                  <input
                    type="text"
                    value={formData.fieldKey}
                    onChange={(e) => setFormData({ ...formData, fieldKey: e.target.value })}
                    placeholder="e.g., fitness_goals"
                    className="w-full px-4 py-2 border rounded bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Label</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g., Fitness Goals"
                    className="w-full px-4 py-2 border rounded bg-background"
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  />
                  <span className="text-sm">Required Field</span>
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingField(null);
                    resetForm();
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  {editingField ? 'Update Field' : 'Create Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFieldsManager;
