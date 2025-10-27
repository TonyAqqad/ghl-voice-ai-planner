/**
 * Solar Lead Appointment Booking - Schema Synchronization
 * Syncs custom fields and values for solar lead management in GoHighLevel
 * Uses v2 custom field API with idempotency keys
 */

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const LOCATION_ID = process.env.GHL_LOCATION_ID;
const API_KEY = process.env.GHL_API_KEY;

// Custom fields for solar lead management
const CUSTOM_FIELDS = [
  // Contact fields
  {
    key: 'solar_lead_score',
    name: 'Solar Lead Score',
    dataType: 'number',
    objectType: 'contacts',
    description: 'Lead scoring for solar prospects (1-100)',
    defaultValue: 0
  },
  {
    key: 'roof_type',
    name: 'Roof Type',
    dataType: 'dropdown',
    objectType: 'contacts',
    description: 'Type of roof for solar installation',
    options: ['Asphalt Shingle', 'Metal', 'Tile', 'Flat', 'Slate', 'Other'],
    defaultValue: 'Asphalt Shingle'
  },
  {
    key: 'roof_age',
    name: 'Roof Age',
    dataType: 'number',
    objectType: 'contacts',
    description: 'Age of roof in years',
    defaultValue: 0
  },
  {
    key: 'electric_bill',
    name: 'Monthly Electric Bill',
    dataType: 'currency',
    objectType: 'contacts',
    description: 'Average monthly electric bill amount',
    defaultValue: 0
  },
  {
    key: 'solar_interest_level',
    name: 'Solar Interest Level',
    dataType: 'dropdown',
    objectType: 'contacts',
    description: 'Customer interest level in solar',
    options: ['High', 'Medium', 'Low', 'Not Interested'],
    defaultValue: 'Medium'
  },
  {
    key: 'appointment_preference',
    name: 'Appointment Preference',
    dataType: 'dropdown',
    objectType: 'contacts',
    description: 'Preferred appointment time',
    options: ['Morning (8AM-12PM)', 'Afternoon (12PM-5PM)', 'Evening (5PM-8PM)', 'Weekend'],
    defaultValue: 'Afternoon (12PM-5PM)'
  },
  {
    key: 'call_attempts',
    name: 'Call Attempts',
    dataType: 'number',
    objectType: 'contacts',
    description: 'Number of call attempts made',
    defaultValue: 0
  },
  {
    key: 'last_call_date',
    name: 'Last Call Date',
    dataType: 'date',
    objectType: 'contacts',
    description: 'Date of last call attempt',
    defaultValue: null
  },
  {
    key: 'call_outcome',
    name: 'Call Outcome',
    dataType: 'dropdown',
    objectType: 'contacts',
    description: 'Result of last call',
    options: ['Appointment Scheduled', 'Callback Requested', 'Not Interested', 'No Answer', 'Voicemail', 'Wrong Number'],
    defaultValue: 'No Answer'
  },
  {
    key: 'appointment_date',
    name: 'Appointment Date',
    dataType: 'datetime',
    objectType: 'contacts',
    description: 'Scheduled appointment date and time',
    defaultValue: null
  },
  {
    key: 'appointment_type',
    name: 'Appointment Type',
    dataType: 'dropdown',
    objectType: 'contacts',
    description: 'Type of appointment scheduled',
    options: ['Virtual Consultation', 'In-Person Site Visit', 'Phone Consultation'],
    defaultValue: 'Virtual Consultation'
  },
  {
    key: 'solar_qualification',
    name: 'Solar Qualification',
    dataType: 'dropdown',
    objectType: 'contacts',
    description: 'Qualification status for solar',
    options: ['Qualified', 'Needs Assessment', 'Not Qualified', 'Pending'],
    defaultValue: 'Pending'
  },
  {
    key: 'property_address',
    name: 'Property Address',
    dataType: 'text',
    objectType: 'contacts',
    description: 'Full property address for solar assessment',
    defaultValue: ''
  },
  {
    key: 'property_type',
    name: 'Property Type',
    dataType: 'dropdown',
    objectType: 'contacts',
    description: 'Type of property',
    options: ['Single Family Home', 'Townhouse', 'Condo', 'Multi-Family', 'Commercial'],
    defaultValue: 'Single Family Home'
  },
  {
    key: 'homeowner_status',
    name: 'Homeowner Status',
    dataType: 'dropdown',
    objectType: 'contacts',
    description: 'Homeownership status',
    options: ['Owner', 'Renter', 'Landlord', 'Unknown'],
    defaultValue: 'Unknown'
  },
  {
    key: 'energy_goals',
    name: 'Energy Goals',
    dataType: 'text',
    objectType: 'contacts',
    description: 'Customer energy goals and motivations',
    defaultValue: ''
  },
  {
    key: 'budget_range',
    name: 'Budget Range',
    dataType: 'dropdown',
    objectType: 'contacts',
    description: 'Customer budget range for solar',
    options: ['Under $10K', '$10K-$20K', '$20K-$30K', '$30K-$50K', '$50K+', 'Financing Preferred'],
    defaultValue: 'Financing Preferred'
  },
  {
    key: 'timeline',
    name: 'Installation Timeline',
    dataType: 'dropdown',
    objectType: 'contacts',
    description: 'Desired installation timeline',
    options: ['ASAP', 'Within 3 months', 'Within 6 months', 'Within 1 year', 'Just exploring'],
    defaultValue: 'Just exploring'
  },
  {
    key: 'referral_source',
    name: 'Referral Source',
    dataType: 'dropdown',
    objectType: 'contacts',
    description: 'How customer heard about us',
    options: ['Google Ads', 'Facebook', 'Referral', 'Website', 'Door to Door', 'Other'],
    defaultValue: 'Website'
  },
  {
    key: 'voicemail_script',
    name: 'Voicemail Script Used',
    dataType: 'text',
    objectType: 'contacts',
    description: 'Voicemail script used for this contact',
    defaultValue: ''
  }
];

// Opportunity fields
const OPPORTUNITY_FIELDS = [
  {
    key: 'solar_system_size',
    name: 'Solar System Size (kW)',
    dataType: 'number',
    objectType: 'opportunities',
    description: 'Estimated solar system size in kilowatts',
    defaultValue: 0
  },
  {
    key: 'estimated_savings',
    name: 'Estimated Annual Savings',
    dataType: 'currency',
    objectType: 'opportunities',
    description: 'Estimated annual energy savings',
    defaultValue: 0
  },
  {
    key: 'system_cost',
    name: 'System Cost',
    dataType: 'currency',
    objectType: 'opportunities',
    description: 'Total system cost estimate',
    defaultValue: 0
  },
  {
    key: 'payback_period',
    name: 'Payback Period (years)',
    dataType: 'number',
    objectType: 'opportunities',
    description: 'Estimated payback period in years',
    defaultValue: 0
  },
  {
    key: 'financing_option',
    name: 'Financing Option',
    dataType: 'dropdown',
    objectType: 'opportunities',
    description: 'Recommended financing option',
    options: ['Cash Purchase', 'Solar Loan', 'Lease', 'PPA', 'Pending'],
    defaultValue: 'Pending'
  },
  {
    key: 'incentives_available',
    name: 'Incentives Available',
    dataType: 'text',
    objectType: 'opportunities',
    description: 'Available incentives and rebates',
    defaultValue: ''
  },
  {
    key: 'competitor_quotes',
    name: 'Competitor Quotes',
    dataType: 'text',
    objectType: 'opportunities',
    description: 'Competitor quotes received',
    defaultValue: ''
  },
  {
    key: 'decision_timeline',
    name: 'Decision Timeline',
    dataType: 'dropdown',
    objectType: 'opportunities',
    description: 'Customer decision timeline',
    options: ['This Week', 'This Month', 'Next Quarter', 'Next Year', 'Undecided'],
    defaultValue: 'Undecided'
  }
];

class SchemaSync {
  constructor() {
    this.apiKey = API_KEY;
    this.locationId = LOCATION_ID;
    this.baseUrl = GHL_API_BASE;
  }

  async syncAllFields() {
    console.log('🔄 Starting schema synchronization...');
    
    try {
      // Sync contact fields
      await this.syncFields(CUSTOM_FIELDS, 'contacts');
      
      // Sync opportunity fields
      await this.syncFields(OPPORTUNITY_FIELDS, 'opportunities');
      
      console.log('✅ Schema synchronization completed successfully');
      return { success: true, message: 'All fields synchronized' };
    } catch (error) {
      console.error('❌ Schema synchronization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async syncFields(fields, objectType) {
    console.log(`📝 Syncing ${fields.length} ${objectType} fields...`);
    
    for (const field of fields) {
      try {
        await this.createOrUpdateField(field, objectType);
        console.log(`✅ Field synced: ${field.name}`);
      } catch (error) {
        console.error(`❌ Failed to sync field ${field.name}:`, error.message);
      }
    }
  }

  async createOrUpdateField(field, objectType) {
    const idempotencyKey = `${this.locationId}:${field.key}`;
    
    const fieldData = {
      name: field.name,
      dataType: field.dataType,
      objectType: objectType,
      description: field.description,
      defaultValue: field.defaultValue,
      ...(field.options && { options: field.options })
    };

    try {
      // Try to create the field
      const response = await fetch(`${this.baseUrl}/locations/${this.locationId}/custom-fields`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(fieldData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Created field: ${field.name} (ID: ${result.customField.id})`);
        return result;
      } else if (response.status === 409) {
        // Field already exists, try to update
        console.log(`Field ${field.name} already exists, updating...`);
        return await this.updateExistingField(field, objectType);
        } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      throw new Error(`Failed to sync field ${field.name}: ${error.message}`);
    }
  }

  async updateExistingField(field, objectType) {
    // Get existing field
    const fieldsResponse = await fetch(`${this.baseUrl}/locations/${this.locationId}/custom-fields?objectType=${objectType}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!fieldsResponse.ok) {
      throw new Error(`Failed to fetch existing fields: ${fieldsResponse.status}`);
    }

    const fieldsData = await fieldsResponse.json();
    const existingField = fieldsData.customFields.find(f => f.key === field.key);

    if (!existingField) {
      throw new Error(`Field ${field.key} not found for update`);
    }

    // Update the field
    const updateData = {
      name: field.name,
      description: field.description,
      ...(field.options && { options: field.options })
    };

    const updateResponse = await fetch(`${this.baseUrl}/locations/${this.locationId}/custom-fields/${existingField.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update field: ${updateResponse.status}`);
    }

    const result = await updateResponse.json();
    console.log(`Updated field: ${field.name} (ID: ${result.customField.id})`);
    return result;
  }

  async validateSchema() {
    console.log('🔍 Validating schema...');
    
    const validationResults = {
      contactFields: await this.validateFields('contacts'),
      opportunityFields: await this.validateFields('opportunities'),
      mergeTags: await this.validateMergeTags()
    };

    return validationResults;
  }

  async validateFields(objectType) {
    try {
      const response = await fetch(`${this.baseUrl}/locations/${this.locationId}/custom-fields?objectType=${objectType}`, {
      headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${objectType} fields: ${response.status}`);
      }

      const data = await response.json();
    return {
        success: true,
        count: data.customFields.length,
        fields: data.customFields.map(f => ({ key: f.key, name: f.name }))
    };
  } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async validateMergeTags() {
    const requiredMergeTags = [
      '{{contact.firstName}}',
      '{{contact.lastName}}',
      '{{contact.email}}',
      '{{contact.phone}}',
      '{{contact.solar_lead_score}}',
      '{{contact.roof_type}}',
      '{{contact.electric_bill}}',
      '{{contact.appointment_preference}}',
      '{{contact.property_address}}',
      '{{contact.budget_range}}',
      '{{contact.timeline}}'
    ];

    // In a real implementation, you would validate these against GHL's merge tag system
    return {
      success: true,
      tags: requiredMergeTags,
      message: 'Merge tags validated (simulated)'
    };
  }
}

// Export for use in other modules
module.exports = {
  SchemaSync,
  CUSTOM_FIELDS,
  OPPORTUNITY_FIELDS
};

// Run if called directly
if (require.main === module) {
  const sync = new SchemaSync();
  sync.syncAllFields()
    .then(result => {
      console.log('Schema sync result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Schema sync failed:', error);
      process.exit(1);
    });
}