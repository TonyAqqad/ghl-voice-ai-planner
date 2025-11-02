import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Users, Clock, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  contact: string;
  phone: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  timestamp: string;
  cost: number;
}

const SMSMessaging: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({
    contact: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    // DISABLED: Sandboxed mode - no GHL API calls to prevent 429 errors
    console.log('GHL API calls disabled in sandbox mode - using sample messages');
    setIsLoading(false);
    
    /* Original API call commented out
    setIsLoading(true);
    try {
      const response = await fetch('https://ghlvoiceai.captureclient.com/api/ghl/conversations');
      if (response.ok) {
        const data = await response.json();
        // Process conversation data into messages
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
    */
  };

  const sendMessage = async () => {
    if (!composeData.phone || !composeData.message) {
      toast.error('Please provide phone and message');
      return;
    }

    // DISABLED: Sandboxed mode - no GHL API calls to prevent 429 errors
    toast.info('SMS sending disabled in sandbox mode');
    setComposeData({ contact: '', phone: '', message: '' });
    setComposeOpen(false);
    
    /* Original API call commented out
    try {
      const response = await fetch('https://ghlvoiceai.captureclient.com/api/ghl/conversations/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: 'your_location_id',
          contactId: composeData.contact,
          message: composeData.message,
          type: 'SMS'
        })
      });

      if (response.ok) {
        toast.success('Message sent successfully!');
        setComposeData({ contact: '', phone: '', message: '' });
        setComposeOpen(false);
        loadMessages();
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      toast.error('Error sending message');
    }
    */
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msg.phone.includes(searchTerm) ||
                         msg.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || msg.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: messages.length,
    sent: messages.filter(m => m.status === 'sent').length,
    delivered: messages.filter(m => m.status === 'delivered').length,
    failed: messages.filter(m => m.status === 'failed').length
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">SMS Messaging</h1>
            <p className="text-muted-foreground">
              Send and manage SMS messages via GoHighLevel
            </p>
          </div>
          <button
            onClick={() => setComposeOpen(true)}
            className="btn btn-primary flex items-center"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            New Message
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Messages</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Send className="w-8 h-8 text-green-500" />
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{stats.sent}</div>
          <div className="text-sm text-muted-foreground">Sent</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-purple-500" />
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{stats.delivered}</div>
          <div className="text-sm text-muted-foreground">Delivered</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold">{stats.failed}</div>
          <div className="text-sm text-muted-foreground">Failed</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded bg-background"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded bg-background"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Messages</h2>
        {isLoading ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No messages yet</p>
            <button
              onClick={() => setComposeOpen(true)}
              className="mt-4 btn btn-primary"
            >
              Send Your First Message
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <div key={message.id} className="p-4 border rounded hover:bg-accent/5 transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold">{message.contact}</div>
                    <div className="text-sm text-muted-foreground">{message.phone}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded text-sm ${
                      message.status === 'sent' ? 'bg-blue-500/20 text-blue-500' :
                      message.status === 'delivered' ? 'bg-green-500/20 text-green-500' :
                      message.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {message.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Compose Message</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Contact ID (Optional)</label>
                <input
                  type="text"
                  value={composeData.contact}
                  onChange={(e) => setComposeData({ ...composeData, contact: e.target.value })}
                  className="w-full px-4 py-2 border rounded bg-background"
                  placeholder="Leave empty for new contact"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={composeData.phone}
                  onChange={(e) => setComposeData({ ...composeData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded bg-background"
                  placeholder="+1234567890"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <textarea
                  value={composeData.message}
                  onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 border rounded bg-background"
                  placeholder="Enter your message..."
                  required
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setComposeOpen(false)}
                className="flex-1 btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                className="flex-1 btn btn-primary flex items-center justify-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSMessaging;

