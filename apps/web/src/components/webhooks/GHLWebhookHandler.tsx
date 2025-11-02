import React, { useState, useEffect } from 'react';
import { 
  Webhook, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Activity, 
  Database, 
  Users, 
  Phone, 
  Calendar, 
  Workflow, 
  Target,
  BarChart3,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Filter,
  Search
} from 'lucide-react';
import { ghlApiClient } from '../../utils/ghlApi';

interface WebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  payload: any;
  signature: string;
  verified: boolean;
  processed: boolean;
  error?: string;
}

const GHLWebhookHandler: React.FC = () => {
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample webhook events
  useEffect(() => {
    setWebhookEvents([
      {
        id: '1',
        type: 'ContactCreated',
        timestamp: '2024-01-15T10:30:00Z',
        payload: {
          contact: {
            id: 'contact_123',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@email.com',
            phone: '+1-555-0123'
          }
        },
        signature: 'sha256=abc123...',
        verified: true,
        processed: true
      },
      {
        id: '2',
        type: 'OpportunityCreated',
        timestamp: '2024-01-15T10:25:00Z',
        payload: {
          opportunity: {
            id: 'opp_456',
            name: 'F45 Membership Sale',
            value: 2500,
            stage: 'qualified'
          }
        },
        signature: 'sha256=def456...',
        verified: true,
        processed: true
      },
      {
        id: '3',
        type: 'WorkflowExecuted',
        timestamp: '2024-01-15T10:20:00Z',
        payload: {
          workflow: {
            id: 'workflow_789',
            name: 'Lead Qualification',
            status: 'completed'
          }
        },
        signature: 'sha256=ghi789...',
        verified: false,
        processed: false,
        error: 'Invalid signature'
      }
    ]);
  }, []);

  const webhookTypes = [
    { id: 'all', label: 'All Events', icon: Activity },
    { id: 'ContactCreated', label: 'Contact Created', icon: Users },
    { id: 'ContactUpdated', label: 'Contact Updated', icon: Users },
    { id: 'OpportunityCreated', label: 'Opportunity Created', icon: Target },
    { id: 'AppointmentCreated', label: 'Appointment Created', icon: Calendar },
    { id: 'WorkflowExecuted', label: 'Workflow Executed', icon: Workflow }
  ];

  const filteredEvents = webhookEvents.filter(event => {
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesSearch = event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.payload?.contact?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.payload?.opportunity?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  const handleProcessWebhook = async (event: WebhookEvent) => {
    setIsProcessing(true);
    try {
      await ghlApiClient.processWebhook(JSON.stringify(event.payload), event.signature);
      console.log('Webhook processed successfully:', event.id);
    } catch (error) {
      console.error('Webhook processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryWebhook = async (event: WebhookEvent) => {
    await handleProcessWebhook(event);
  };

  const handleDeleteWebhook = (eventId: string) => {
    setWebhookEvents(events => events.filter(e => e.id !== eventId));
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ContactCreated':
      case 'ContactUpdated':
        return Users;
      case 'OpportunityCreated':
        return Target;
      case 'AppointmentCreated':
        return Calendar;
      case 'WorkflowExecuted':
        return Workflow;
      default:
        return Activity;
    }
  };

  const getEventColor = (event: WebhookEvent) => {
    if (!event.verified) return 'text-red-600';
    if (event.processed) return 'text-green-600';
    return 'text-yellow-600';
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">GHL Webhook Handler</h1>
            <p className="text-muted-foreground">
              Monitor and process GoHighLevel webhook events
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button className="btn btn-primary">
              <Webhook className="w-4 h-4 mr-2" />
              Test Webhook
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Events</p>
              <p className="text-2xl font-bold">{webhookEvents.length}</p>
            </div>
            <Activity className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Processed</p>
              <p className="text-2xl font-bold">{webhookEvents.filter(e => e.processed).length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Verified</p>
              <p className="text-2xl font-bold">{webhookEvents.filter(e => e.verified).length}</p>
            </div>
            <Database className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Errors</p>
              <p className="text-2xl font-bold">{webhookEvents.filter(e => !e.verified || e.error).length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search webhook events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {webhookTypes.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Webhook Events */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Webhook Events</h2>
          <div className="flex space-x-2">
            <button className="btn btn-outline btn-sm">
              <Eye className="w-4 h-4 mr-1" />
              View Raw
            </button>
            <button className="btn btn-outline btn-sm">
              <Filter className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const EventIcon = getEventIcon(event.type);
            return (
              <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      event.verified ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <EventIcon className={`w-4 h-4 ${getEventColor(event)}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium">{event.type}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.verified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {event.verified ? 'Verified' : 'Invalid'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.processed 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.processed ? 'Processed' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </div>
                      {event.error && (
                        <p className="text-sm text-red-600 mt-2">
                          Error: {event.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!event.processed && (
                      <button
                        onClick={() => handleProcessWebhook(event)}
                        disabled={isProcessing}
                        className="btn btn-primary btn-sm"
                      >
                        <Activity className="w-4 h-4 mr-1" />
                        Process
                      </button>
                    )}
                    {event.error && (
                      <button
                        onClick={() => handleRetryWebhook(event)}
                        className="btn btn-outline btn-sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteWebhook(event.id)}
                      className="btn btn-outline btn-sm text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GHLWebhookHandler;
