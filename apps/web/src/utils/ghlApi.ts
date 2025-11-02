/**
 * GHL API Integration Utility
 * Handles OAuth authentication and API calls to GoHighLevel
 */

interface GHLTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface GHLWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  trigger: {
    type: string;
    conditions: Record<string, any>;
  };
  actions: Array<{
    id: string;
    type: string;
    config: Record<string, any>;
  }>;
  createdAt: string;
  updatedAt: string;
}

class GHLAPIClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = import.meta.env.VITE_GHL_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_GHL_CLIENT_SECRET || '';
    this.baseUrl = 'https://services.leadconnectorhq.com';
  }

  /**
   * Get GHL shared secret for webhook verification
   */
  getSharedSecret(): string {
    return import.meta.env.VITE_GHL_SHARED_SECRET || '';
  }

  /**
   * Initialize OAuth flow
   */
  async initializeAuth(): Promise<string> {
    // Always use production OAuth API endpoint
    // GHL doesn't support localhost redirect URIs
    const oauthApiUrl = 'https://ghlvoiceai.captureclient.com/auth/ghl';
    
    // Use OAuth API endpoint
    console.log('📍 Initiating OAuth via API:', oauthApiUrl);
    window.location.href = oauthApiUrl;
    return oauthApiUrl;
  }

  /**
   * Exchange authorization code for access token
   * Uses tested OAuth2 flow from Postman collection
   */
  async exchangeCodeForToken(code: string, state: string): Promise<GHLTokenResponse> {
    const storedState = localStorage.getItem('ghl_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    // For local development, use localhost. For production, use captureclient.com
    const redirectUri = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001/auth/ghl/callback'
      : 'https://captureclient.com/oauth/callback';
    
    try {
      const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code: code,
          user_type: 'Location',
          redirect_uri: redirectUri
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OAuth token exchange failed:', errorData);
        throw new Error(`OAuth token exchange failed: ${response.statusText}`);
      }

      const tokenData: GHLTokenResponse = await response.json();
      
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token || null;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
      
      // Store tokens securely
      localStorage.setItem('ghl_access_token', this.accessToken);
      if (this.refreshToken) {
        localStorage.setItem('ghl_refresh_token', this.refreshToken);
      }
      localStorage.setItem('ghl_token_expiry', this.tokenExpiry.toString());
      
      console.log('✅ OAuth tokens received and stored');
      return tokenData;
    } catch (error) {
      console.error('❌ OAuth error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * Updated to match tested OAuth2 flow
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          user_type: 'Location'
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Token refresh failed:', errorData);
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const tokenData: GHLTokenResponse = await response.json();
      
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
      
      localStorage.setItem('ghl_access_token', this.accessToken);
      localStorage.setItem('ghl_token_expiry', this.tokenExpiry.toString());
      
      if (tokenData.refresh_token) {
        this.refreshToken = tokenData.refresh_token;
        localStorage.setItem('ghl_refresh_token', this.refreshToken);
      }
      
      console.log('✅ Token refreshed successfully');
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(): Promise<string> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      // Try to refresh token
      try {
        await this.refreshAccessToken();
      } catch (error) {
        // If refresh fails, need to re-authenticate
        throw new Error('Authentication expired. Please re-authenticate.');
      }
    }

    return this.accessToken!;
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getValidAccessToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get contacts from GHL
   */
  async getContacts(limit: number = 100, offset: number = 0): Promise<{ contacts: GHLContact[]; total: number }> {
    const response = await this.makeRequest(`/contacts?limit=${limit}&offset=${offset}`);
    return response;
  }

  /**
   * Create contact in GHL
   */
  async createContact(contact: Partial<GHLContact>): Promise<GHLContact> {
    const response = await this.makeRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
    return response.contact;
  }

  /**
   * Update contact in GHL
   */
  async updateContact(contactId: string, updates: Partial<GHLContact>): Promise<GHLContact> {
    const response = await this.makeRequest(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.contact;
  }

  /**
   * Get workflows from GHL
   */
  async getWorkflows(): Promise<{ workflows: GHLWorkflow[] }> {
    const response = await this.makeRequest('/workflows');
    return response;
  }

  /**
   * Create workflow in GHL
   */
  async createWorkflow(workflow: Partial<GHLWorkflow>): Promise<GHLWorkflow> {
    const response = await this.makeRequest('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
    return response.workflow;
  }

  /**
   * Update workflow in GHL
   */
  async updateWorkflow(workflowId: string, updates: Partial<GHLWorkflow>): Promise<GHLWorkflow> {
    const response = await this.makeRequest(`/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.workflow;
  }

  /**
   * Get opportunities from GHL
   */
  async getOpportunities(limit: number = 100, offset: number = 0): Promise<{ opportunities: any[]; total: number }> {
    const response = await this.makeRequest(`/opportunities?limit=${limit}&offset=${offset}`);
    return response;
  }

  /**
   * Create opportunity in GHL
   */
  async createOpportunity(opportunity: any): Promise<any> {
    const response = await this.makeRequest('/opportunities', {
      method: 'POST',
      body: JSON.stringify(opportunity),
    });
    return response.opportunity;
  }

  /**
   * Get appointments from GHL
   */
  async getAppointments(limit: number = 100, offset: number = 0): Promise<{ appointments: any[]; total: number }> {
    const response = await this.makeRequest(`/appointments?limit=${limit}&offset=${offset}`);
    return response;
  }

  /**
   * Create appointment in GHL
   */
  async createAppointment(appointment: any): Promise<any> {
    const response = await this.makeRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
    return response.appointment;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/contacts?limit=1');
      return true;
    } catch (error) {
      console.error('GHL API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get location token (for sub-accounts)
   */
  async getLocationToken(locationId: string): Promise<string> {
    const companyToken = await this.getValidAccessToken();
    
    try {
      const response = await fetch(`${this.baseUrl}/oauth/locationToken`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${companyToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationId })
      });

      if (!response.ok) {
        throw new Error(`Location token error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Location token error:', error);
      throw error;
    }
  }

  /**
   * Upsert contact with custom fields
   */
  async upsertContact(locationToken: string, locationId: string, contactData: any, customFieldId?: string): Promise<any> {
    const contactPayload: any = {
      locationId,
      firstName: contactData.firstName,
      phone: contactData.phone
    };
    
    if (customFieldId && contactData.customFieldValue) {
      contactPayload.customFields = [
        { id: customFieldId, value: contactData.customFieldValue }
      ];
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/contacts/upsert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${locationToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactPayload)
      });

      if (!response.ok) {
        throw new Error(`Upsert contact error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.contact;
    } catch (error) {
      console.error('Upsert contact error:', error);
      throw error;
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(locationToken: string, locationId: string, contactId: string, message: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${locationToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locationId,
          contactId,
          message,
          type: 'SMS',
          assignedTo: locationId
        })
      });

      if (!response.ok) {
        throw new Error(`Send message error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  /**
   * Get API rate limits
   */
  async getRateLimits(): Promise<any> {
    const response = await this.makeRequest('/rate-limits');
    return response;
  }

  /**
   * Verify webhook signature from GHL
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const sharedSecret = this.getSharedSecret();
    if (!sharedSecret) {
      console.warn('GHL shared secret not configured');
      return false;
    }

    try {
      // GHL uses HMAC-SHA256 for webhook signature verification
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', sharedSecret)
        .update(payload, 'utf8')
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process incoming webhook from GHL
   */
  async processWebhook(payload: string, signature: string): Promise<any> {
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    try {
      const data = JSON.parse(payload);
      console.log('Received GHL webhook:', data);
      
      // Process different webhook events
      switch (data.type) {
        case 'ContactCreated':
          return this.handleContactCreated(data);
        case 'ContactUpdated':
          return this.handleContactUpdated(data);
        case 'OpportunityCreated':
          return this.handleOpportunityCreated(data);
        case 'AppointmentCreated':
          return this.handleAppointmentCreated(data);
        case 'WorkflowExecuted':
          return this.handleWorkflowExecuted(data);
        default:
          console.log('Unknown webhook type:', data.type);
          return data;
      }
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Handle contact created webhook
   */
  private async handleContactCreated(data: any): Promise<any> {
    console.log('Contact created:', data.contact);
    // Add your custom logic here
    return data;
  }

  /**
   * Handle contact updated webhook
   */
  private async handleContactUpdated(data: any): Promise<any> {
    console.log('Contact updated:', data.contact);
    // Add your custom logic here
    return data;
  }

  /**
   * Handle opportunity created webhook
   */
  private async handleOpportunityCreated(data: any): Promise<any> {
    console.log('Opportunity created:', data.opportunity);
    // Add your custom logic here
    return data;
  }

  /**
   * Handle appointment created webhook
   */
  private async handleAppointmentCreated(data: any): Promise<any> {
    console.log('Appointment created:', data.appointment);
    // Add your custom logic here
    return data;
  }

  /**
   * Handle workflow executed webhook
   */
  private async handleWorkflowExecuted(data: any): Promise<any> {
    console.log('Workflow executed:', data.workflow);
    // Add your custom logic here
    return data;
  }

  /**
   * Generate random string for OAuth state
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('ghl_access_token');
    const expiry = localStorage.getItem('ghl_token_expiry');
    
    if (!token || !expiry) {
      return false;
    }
    
    return Date.now() < parseInt(expiry);
  }

  /**
   * Logout and clear tokens
   */
  logout(): void {
    localStorage.removeItem('ghl_access_token');
    localStorage.removeItem('ghl_refresh_token');
    localStorage.removeItem('ghl_token_expiry');
    localStorage.removeItem('ghl_oauth_state');
    
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = 0;
  }
}

// Create singleton instance
export const ghlApiClient = new GHLAPIClient();

// Export types
export type { GHLContact, GHLWorkflow, GHLTokenResponse };
