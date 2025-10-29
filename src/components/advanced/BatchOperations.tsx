import React, { useState } from 'react';
import { 
  Copy, 
  Trash2, 
  Download, 
  Upload, 
  Save, 
  Check, 
  X,
  AlertCircle,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStore } from '../../store/useStore';

interface BatchOperationsProps {
  type: 'agents' | 'workflows' | 'contacts';
  items: any[];
  onBatchAction: (selectedIds: string[], action: string) => void;
}

const BatchOperations: React.FC<BatchOperationsProps> = ({ type, items, onBatchAction }) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const { voiceAgents } = useStore();

  const selectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const toggleItem = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const handleBatchAction = async (action: string) => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to perform this action');
      return;
    }

    setIsProcessing(true);
    
    try {
      const selectedIds = Array.from(selectedItems);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      onBatchAction(selectedIds, action);
      
      toast.success(`${action} completed for ${selectedIds.length} items`);
      setSelectedItems(new Set());
    } catch (error) {
      toast.error(`Failed to ${action} items`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedItems.size === 0) return null;

  const actions = [
    { id: 'delete', label: 'Delete', icon: Trash2, variant: 'destructive' as const },
    { id: 'copy', label: 'Copy', icon: Copy, variant: 'default' as const },
    { id: 'export', label: 'Export', icon: Download, variant: 'default' as const },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="card p-4 shadow-2xl">
        <div className="flex items-center space-x-6">
          {/* Selection Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {selectedItems.size} selected
              </p>
              <p className="text-xs text-muted-foreground">
                Choose an action
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleBatchAction(action.id)}
                disabled={isProcessing}
                className={`btn btn-${action.variant} btn-sm flex items-center space-x-2 ${
                  isProcessing ? 'opacity-50 cursor-not-waiting' : ''
                }`}
              >
                <action.icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Cancel */}
          <button
            onClick={() => setSelectedItems(new Set())}
            className="btn btn-outline btn-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchOperations;

