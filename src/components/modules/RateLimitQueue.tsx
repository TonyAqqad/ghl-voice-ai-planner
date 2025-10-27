import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Trash2, 
  Settings, 
  BarChart3, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Zap,
  Database,
  Webhook,
  RotateCcw
} from 'lucide-react';

interface QueueItem {
  id: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  endpoint: string;
  data: any;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'rate-limited';
  createdAt: Date;
  retries: number;
  lastAttempt?: Date;
  nextRetry?: number;
}

interface RateLimit {
  limit: number;
  period: number;
  used: number;
  resetTime: number;
}

interface QueueSettings {
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  maxRetries: number;
}

const RateLimitQueue: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'settings' | 'analytics' | 'logs'>('queue');
  const [logs, setLogs] = useState<Array<{ type: string; message: string; timestamp: string }>>([
    { type: 'info', message: 'Rate limit queue initialized. Ready to process requests.', timestamp: new Date().toLocaleTimeString() }
  ]);

  const [rateLimits, setRateLimits] = useState<{ [key: string]: RateLimit }>({
    ghl: { limit: 100, period: 60, used: 0, resetTime: Date.now() + 60000 },
    voice: { limit: 100, period: 60, used: 0, resetTime: Date.now() + 60000 },
    webhook: { limit: 100, period: 60, used: 0, resetTime: Date.now() + 60000 }
  });

  const [settings, setSettings] = useState<QueueSettings>({
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    maxRetries: 5
  });

  useEffect(() => {
    loadSettings();
    addSampleRequests();
    startQueueProcessor();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('ghl-queue-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  };

  const saveSettings = () => {
    localStorage.setItem('ghl-queue-settings', JSON.stringify(settings));
    addLog('success', 'Settings saved');
  };

  const addLog = (type: string, message: string) => {
    const newLog = {
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [...prev, newLog]);
  };

  const addSampleRequests = () => {
    const sampleRequests = [
      { type: 'api_call', priority: 'high' as const, endpoint: 'ghl/contacts/create', data: { name: 'John Doe' } },
      { type: 'api_call', priority: 'medium' as const, endpoint: 'voice/agent/update', data: { agentId: '123' } },
      { type: 'api_call', priority: 'low' as const, endpoint: 'webhook/trigger', data: { event: 'contact_created' } },
      { type: 'api_call', priority: 'high' as const, endpoint: 'ghl/opportunities/create', data: { contactId: '456' } },
      { type: 'api_call', priority: 'medium' as const, endpoint: 'voice/agent/test', data: { agentId: '123' } }
    ];

    sampleRequests.forEach(request => addRequest(request));
  };

  const addRequest = (request: Partial<QueueItem>) => {
    const queueItem: QueueItem = {
      id: Date.now().toString(),
      type: request.type || 'api_call',
      priority: request.priority || 'medium',
      endpoint: request.endpoint || 'unknown',
      data: request.data || {},
      status: 'queued',
      createdAt: new Date(),
      retries: 0
    };
    
    setQueue(prev => [...prev, queueItem]);
    addLog('info', `Added request to queue: ${queueItem.endpoint}`);
  };

  const startQueueProcessor = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    addLog('info', 'Starting queue processing...');
    
    while (queue.length > 0 && isProcessing) {
      const item = queue.find(i => i.status === 'queued' && (!i.nextRetry || Date.now() >= i.nextRetry));
      if (!item) break;
      
      await processRequest(item);
      await delay(100); // Small delay between requests
    }
    
    setIsProcessing(false);
    addLog('info', 'Queue processing completed');
  };

  const processRequest = async (item: QueueItem) => {
    setQueue(prev => prev.map(i => 
      i.id === item.id ? { ...i, status: 'processing' as const, lastAttempt: new Date() } : i
    ));
    
    try {
      // Check rate limits
      const apiType = getApiType(item.endpoint);
      if (!checkRateLimit(apiType)) {
        const nextRetry = Date.now() + calculateBackoffDelay(item.retries);
        setQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'rate-limited' as const, nextRetry } : i
        ));
        addLog('warning', `Rate limited: ${item.endpoint}`);
        return;
      }
      
      // Simulate API call
      await simulateApiCall(item);
      
      // Mark as completed
      setQueue(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'completed' as const } : i
      ));
      
      // Update rate limit usage
      setRateLimits(prev => ({
        ...prev,
        [apiType]: {
          ...prev[apiType],
          used: prev[apiType].used + 1
        }
      }));
      
      addLog('success', `Request completed: ${item.endpoint}`);
      
    } catch (error) {
      const newRetries = item.retries + 1;
      if (newRetries >= settings.maxRetries) {
        setQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'failed' as const, retries: newRetries } : i
        ));
        addLog('error', `Request failed after ${newRetries} retries: ${item.endpoint}`);
      } else {
        const nextRetry = Date.now() + calculateBackoffDelay(newRetries);
        setQueue(prev => prev.map(i => 
          i.id === item.id ? { 
            ...i, 
            status: 'queued' as const, 
            retries: newRetries, 
            nextRetry 
          } : i
        ));
        addLog('warning', `Request failed, retrying in ${calculateBackoffDelay(newRetries)}ms: ${item.endpoint}`);
      }
    }
  };

  const simulateApiCall = async (item: QueueItem) => {
    // Simulate API call delay
    const delayTime = Math.random() * 2000 + 500; // 500-2500ms
    await delay(delayTime);
    
    // Simulate occasional failures
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('API call failed');
    }
  };

  const checkRateLimit = (apiType: string): boolean => {
    const limit = rateLimits[apiType];
    const now = Date.now();
    
    // Reset if period has passed
    if (now >= limit.resetTime) {
      setRateLimits(prev => ({
        ...prev,
        [apiType]: {
          ...prev[apiType],
          used: 0,
          resetTime: now + (prev[apiType].period * 1000)
        }
      }));
      return true;
    }
    
    return limit.used < limit.limit;
  };

  const getApiType = (endpoint: string): string => {
    if (endpoint.includes('ghl')) return 'ghl';
    if (endpoint.includes('voice')) return 'voice';
    if (endpoint.includes('webhook')) return 'webhook';
    return 'ghl'; // default
  };

  const calculateBackoffDelay = (retries: number): number => {
    const delay = settings.initialDelay * Math.pow(settings.backoffMultiplier, retries);
    return Math.min(delay, settings.maxDelay);
  };

  const startQueue = () => {
    setIsProcessing(false);
    startQueueProcessor();
    addLog('info', 'Queue started');
  };

  const pauseQueue = () => {
    setIsProcessing(false);
    addLog('info', 'Queue paused');
  };

  const clearQueue = () => {
    if (confirm('Are you sure you want to clear the queue?')) {
      setQueue([]);
      addLog('warning', 'Queue cleared');
    }
  };

  const retryRequest = (itemId: string) => {
    setQueue(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, status: 'queued' as const, retries: 0, nextRetry: undefined }
        : item
    ));
    addLog('info', `Retrying request: ${itemId}`);
  };

  const removeRequest = (itemId: string) => {
    setQueue(prev => prev.filter(item => item.id !== itemId));
    addLog('warning', 'Request removed from queue');
  };

  const clearLogs = () => {
    setLogs([{ type: 'info', message: 'Logs cleared.', timestamp: new Date().toLocaleTimeString() }]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      case 'rate-limited': return 'text-red-400';
      case 'queued': return 'text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'processing': return <Activity className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'rate-limited': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'queued': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'info': return 'text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const stats = {
    total: queue.length,
    queued: queue.filter(i => i.status === 'queued').length,
    processing: queue.filter(i => i.status === 'processing').length,
    completed: queue.filter(i => i.status === 'completed').length,
    failed: queue.filter(i => i.status === 'failed').length
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground gradient-text">Rate Limit Queue</h1>
          <p className="text-muted-foreground mt-2">Intelligent queue management with rate limiting and exponential backoff for API calls</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={startQueue} 
            disabled={isProcessing}
            className="btn btn-primary flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Queue
          </button>
          <button 
            onClick={pauseQueue} 
            className="btn btn-outline flex items-center gap-2"
          >
            <Pause className="w-4 h-4" />
            Pause Queue
          </button>
          <button 
            onClick={clearQueue} 
            className="btn btn-destructive flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Queue
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold gradient-text mb-2">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Requests</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.queued}</div>
          <div className="text-sm text-muted-foreground">Queued</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">{stats.processing}</div>
          <div className="text-sm text-muted-foreground">Processing</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">{stats.completed}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
      </div>

      {/* Rate Limit Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            GHL API
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(rateLimits.ghl.used / rateLimits.ghl.limit) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {rateLimits.ghl.used}/{rateLimits.ghl.limit}
            </span>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Voice AI API
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(rateLimits.voice.used / rateLimits.voice.limit) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {rateLimits.voice.used}/{rateLimits.voice.limit}
            </span>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Webhook API
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(rateLimits.webhook.used / rateLimits.webhook.limit) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {rateLimits.webhook.used}/{rateLimits.webhook.limit}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { id: 'queue', label: 'Request Queue', icon: Activity },
          { id: 'settings', label: 'Rate Limit Settings', icon: Settings },
          { id: 'analytics', label: 'Queue Analytics', icon: BarChart3 },
          { id: 'logs', label: 'Queue Logs', icon: Clock }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Request Queue</h3>
            <div className="space-y-4">
              {queue.map((item) => (
                <div key={item.id} className={`queue-item p-4 rounded-lg border ${getPriorityColor(item.priority)} ${
                  item.status === 'completed' ? 'border-green-400 bg-green-400/10' :
                  item.status === 'processing' ? 'border-blue-400 bg-blue-400/10' :
                  item.status === 'failed' ? 'border-red-400 bg-red-400/10' :
                  item.status === 'rate-limited' ? 'border-red-400 bg-red-400/10' :
                  'border-yellow-400 bg-yellow-400/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(item.status)}
                        <h4 className="font-medium text-foreground">{item.endpoint}</h4>
                        <span className="text-xs px-2 py-1 rounded bg-muted">{item.priority}</span>
                        <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Type: {item.type} | Retries: {item.retries}/{settings.maxRetries}
                      </p>
                      {item.nextRetry && (
                        <p className="text-xs text-muted-foreground">
                          Next retry: {new Date(item.nextRetry).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {item.status === 'queued' && (
                        <button 
                          onClick={() => processRequest(item)}
                          className="btn btn-primary btn-sm flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Process Now
                        </button>
                      )}
                      {item.status === 'failed' && (
                        <button 
                          onClick={() => retryRequest(item.id)}
                          className="btn btn-outline btn-sm flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Retry
                        </button>
                      )}
                      <button 
                        onClick={() => removeRequest(item.id)}
                        className="btn btn-destructive btn-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">API Rate Limits</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">GHL API Rate Limit</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    className="flex-1 p-2 rounded-md bg-card border border-border" 
                    value={rateLimits.ghl.limit}
                    onChange={(e) => setRateLimits(prev => ({
                      ...prev,
                      ghl: { ...prev.ghl, limit: parseInt(e.target.value) }
                    }))}
                  />
                  <select 
                    className="p-2 rounded-md bg-card border border-border"
                    value={rateLimits.ghl.period}
                    onChange={(e) => setRateLimits(prev => ({
                      ...prev,
                      ghl: { ...prev.ghl, period: parseInt(e.target.value) }
                    }))}
                  >
                    <option value={60}>per minute</option>
                    <option value={3600}>per hour</option>
                    <option value={86400}>per day</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Voice AI API Rate Limit</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    className="flex-1 p-2 rounded-md bg-card border border-border" 
                    value={rateLimits.voice.limit}
                    onChange={(e) => setRateLimits(prev => ({
                      ...prev,
                      voice: { ...prev.voice, limit: parseInt(e.target.value) }
                    }))}
                  />
                  <select 
                    className="p-2 rounded-md bg-card border border-border"
                    value={rateLimits.voice.period}
                    onChange={(e) => setRateLimits(prev => ({
                      ...prev,
                      voice: { ...prev.voice, period: parseInt(e.target.value) }
                    }))}
                  >
                    <option value={60}>per minute</option>
                    <option value={3600}>per hour</option>
                    <option value={86400}>per day</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Webhook API Rate Limit</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    className="flex-1 p-2 rounded-md bg-card border border-border" 
                    value={rateLimits.webhook.limit}
                    onChange={(e) => setRateLimits(prev => ({
                      ...prev,
                      webhook: { ...prev.webhook, limit: parseInt(e.target.value) }
                    }))}
                  />
                  <select 
                    className="p-2 rounded-md bg-card border border-border"
                    value={rateLimits.webhook.period}
                    onChange={(e) => setRateLimits(prev => ({
                      ...prev,
                      webhook: { ...prev.webhook, period: parseInt(e.target.value) }
                    }))}
                  >
                    <option value={60}>per minute</option>
                    <option value={3600}>per hour</option>
                    <option value={86400}>per day</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Backoff Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Initial Delay (ms)</label>
                <input 
                  type="number" 
                  className="w-full p-2 rounded-md bg-card border border-border" 
                  value={settings.initialDelay}
                  onChange={(e) => setSettings(prev => ({ ...prev, initialDelay: parseInt(e.target.value) }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Max Delay (ms)</label>
                <input 
                  type="number" 
                  className="w-full p-2 rounded-md bg-card border border-border" 
                  value={settings.maxDelay}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxDelay: parseInt(e.target.value) }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Backoff Multiplier</label>
                <input 
                  type="number" 
                  className="w-full p-2 rounded-md bg-card border border-border" 
                  value={settings.backoffMultiplier}
                  onChange={(e) => setSettings(prev => ({ ...prev, backoffMultiplier: parseFloat(e.target.value) }))}
                  step="0.1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Max Retries</label>
                <input 
                  type="number" 
                  className="w-full p-2 rounded-md bg-card border border-border" 
                  value={settings.maxRetries}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                />
              </div>
              
              <button onClick={saveSettings} className="btn btn-primary w-full">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Queue Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Processing Time</span>
                <span className="font-medium">1.2s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium text-green-400">94.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate Limit Hits</span>
                <span className="font-medium text-yellow-400">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failed Requests</span>
                <span className="font-medium text-red-400">{stats.failed}</span>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">API Usage</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">GHL API Calls</span>
                <span className="font-medium">{rateLimits.ghl.used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voice AI Calls</span>
                <span className="font-medium">{rateLimits.voice.used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Webhook Calls</span>
                <span className="font-medium">{rateLimits.webhook.used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total API Calls</span>
                <span className="font-medium">
                  {rateLimits.ghl.used + rateLimits.voice.used + rateLimits.webhook.used}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">Queue Logs</h3>
            <button onClick={clearLogs} className="btn btn-outline flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Clear Logs
            </button>
          </div>
          <div className="bg-muted p-4 rounded-md h-64 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className={`py-1 ${getLogColor(log.type)}`}>
                [{log.timestamp}] {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RateLimitQueue;
