/**
 * Contact MCP Primitives
 * contact.extractAndUpdate - Extract name/phone/email from transcripts, auto-update GHL or Supabase
 */

const axios = require('axios');
const { pool } = require('../../database');

class ContactPrimitive {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'https://services.leadconnectorhq.com';
    this.version = '2021-07-28';
  }

  /**
   * Get access token for location
   */
  async getAccessToken(locationId) {
    const result = await pool.query(
      'SELECT access_token, expires_at FROM tokens WHERE location_id = $1 ORDER BY created_at DESC LIMIT 1',
      [locationId]
    );

    if (result.rows.length === 0) {
      throw new Error(`No tokens found for location ${locationId}`);
    }

    return result.rows[0].access_token;
  }

  /**
   * Extract contact information from transcript using regex patterns
   */
  extractContactInfo(transcript) {
    const info = {
      name: null,
      phone: null,
      email: null
    };

    // Extract email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatch = transcript.match(emailRegex);
    if (emailMatch) {
      info.email = emailMatch[0];
    }

    // Extract phone number (various formats)
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const phoneMatch = transcript.match(phoneRegex);
    if (phoneMatch) {
      info.phone = phoneMatch[0].replace(/\D/g, '');
    }

    // Extract name (look for "my name is", "I'm", "this is", etc.)
    const namePatterns = [
      /(?:my name is|i'm|i am|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      /(?:i'm|i am)\s+([A-Z][a-z]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = transcript.match(pattern);
      if (match && match[1]) {
        info.name = match[1].trim();
        break;
      }
    }

    return info;
  }

  /**
   * contact.extractAndUpdate - Extract and update contact information
   * @param {Object} params - { transcript, locationId, contactId, updateGHL, updateDatabase }
   * @returns {Promise<Object>} - { extracted, updated, contactId }
   */
  async extractAndUpdate(params) {
    const {
      transcript,
      locationId,
      contactId = null,
      updateGHL = true,
      updateDatabase = true
    } = params;

    try {
      // Extract contact information from transcript
      const extracted = this.extractContactInfo(transcript);

      const updates = {
        ghl: false,
        database: false
      };

      // Update GoHighLevel
      if (updateGHL && locationId && (extracted.email || extracted.phone || extracted.name)) {
        const accessToken = await this.getAccessToken(locationId);
        const headers = {
          'Authorization': `Bearer ${accessToken}`,
          'Version': this.version,
          'Content-Type': 'application/json'
        };

        const contactData = {};
        if (extracted.email) contactData.email = extracted.email;
        if (extracted.phone) contactData.phone = extracted.phone;
        if (extracted.name) contactData.name = extracted.name;

        if (contactId) {
          // Update existing contact
          await axios.put(
            `${this.baseUrl}/contacts/${contactId}`,
            contactData,
            { headers }
          );
        } else {
          // Create new contact
          const response = await axios.post(
            `${this.baseUrl}/contacts`,
            contactData,
            { headers }
          );
          contactId = response.data.contact.id;
        }

        updates.ghl = true;
      }

      // Update database
      if (updateDatabase && (extracted.email || extracted.phone || extracted.name)) {
        // Store in agent_logs
        await pool.query(
          `INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            locationId || 'system',
            'contact.extractAndUpdate',
            JSON.stringify(extracted),
            JSON.stringify({ transcript: transcript.substring(0, 500) }),
            'success'
          ]
        );
        updates.database = true;
      }

      // Log the operation
      await pool.query(
        'INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [
          locationId || 'system',
          'contact.extractAndUpdate',
          JSON.stringify({ extracted, updates }),
          JSON.stringify({ contactId }),
          'success'
        ]
      );

      return {
        extracted,
        updated: updates,
        contactId
      };
    } catch (error) {
      console.error('contact.extractAndUpdate error:', error);

      // Log error
      await pool.query(
        'INSERT INTO agent_logs (agent_id, action, payload, context, status, error_message, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
        [
          locationId || 'system',
          'contact.extractAndUpdate',
          JSON.stringify({ transcript: transcript.substring(0, 500) }),
          JSON.stringify({ contactId }),
          'error',
          error.message
        ]
      );

      throw error;
    }
  }
}

module.exports = ContactPrimitive;

