/**
 * Solar Lead Appointment Booking - Workflow Definitions
 * GoHighLevel workflow triggers and actions for solar lead management
 */

const WORKFLOWS = {
  // Main appointment booking workflow
  appointmentBooking: {
    name: "Solar Appointment Booking",
    description: "Handles appointment booking from voice AI calls",
    trigger: {
      type: "webhook",
      name: "voice_ai_appointment_booking",
      webhookUrl: "{{webhook.base_url}}/ghl/appointment-booking",
      method: "POST",
      headers: {
        "Authorization": "Bearer {{webhook.api_key}}",
        "Content-Type": "application/json"
      }
    },
    actions: [
      {
        type: "update_contact",
        field: "call_outcome",
        value: "Appointment Scheduled"
      },
      {
        type: "update_contact",
        field: "appointment_date",
        value: "{{webhook.appointment_date}}"
      },
      {
        type: "update_contact",
        field: "appointment_type",
        value: "{{webhook.appointment_type}}"
      },
      {
        type: "update_contact",
        field: "solar_qualification",
        value: "Qualified"
      },
      {
        type: "create_opportunity",
        pipeline: "Solar Sales Pipeline",
        stage: "Appointment Scheduled",
        title: "Solar Consultation - {{contact.firstName}} {{contact.lastName}}",
        value: 0,
        customFields: {
          "appointment_date": "{{webhook.appointment_date}}",
          "appointment_type": "{{webhook.appointment_type}}",
          "lead_score": "{{webhook.lead_score}}",
          "decision_timeline": "{{webhook.timeline}}"
        }
      },
      {
        type: "send_email",
        template: "appointment_confirmation",
        to: "{{contact.email}}",
        subject: "Solar Consultation Confirmed - {{appointment_date}}",
        mergeTags: {
          "contact_name": "{{contact.firstName}} {{contact.lastName}}",
          "appointment_date": "{{webhook.appointment_date}}",
          "appointment_time": "{{webhook.appointment_time}}",
          "appointment_type": "{{webhook.appointment_type}}",
          "consultant_name": "{{webhook.consultant_name}}",
          "consultant_phone": "{{webhook.consultant_phone}}",
          "meeting_link": "{{webhook.meeting_link}}"
        }
      },
      {
        type: "send_sms",
        template: "appointment_sms_confirmation",
        to: "{{contact.phone}}",
        message: "Hi {{contact.firstName}}! Your solar consultation is confirmed for {{appointment_date}} at {{appointment_time}}. {{meeting_link}} - Sarah from {{company.name}}"
      },
      {
        type: "create_calendar_event",
        title: "Solar Consultation - {{contact.firstName}} {{contact.lastName}}",
        startTime: "{{webhook.appointment_date}}",
        duration: 60,
        description: "Solar consultation with {{contact.firstName}} {{contact.lastName}}. Phone: {{contact.phone}}, Email: {{contact.email}}",
        attendees: [
          "{{webhook.consultant_email}}",
          "{{contact.email}}"
        ],
        location: "{{webhook.meeting_location}}"
      },
      {
        type: "add_tag",
        tag: "Appointment Scheduled"
      },
      {
        type: "add_tag",
        tag: "Solar Lead"
      },
      {
        type: "add_tag",
        tag: "Qualified Lead"
      }
    ]
  },

  // Callback request workflow
  callbackRequest: {
    name: "Solar Lead Callback Request",
    description: "Handles callback requests from voice AI calls",
    trigger: {
      type: "webhook",
      name: "voice_ai_callback_request",
      webhookUrl: "{{webhook.base_url}}/ghl/callback-request",
      method: "POST"
    },
    actions: [
      {
        type: "update_contact",
        field: "call_outcome",
        value: "Callback Requested"
      },
      {
        type: "update_contact",
        field: "last_call_date",
        value: "{{current_date}}"
      },
      {
        type: "create_task",
        title: "Callback {{contact.firstName}} {{contact.lastName}}",
        description: "Callback requested: {{webhook.callback_reason}}. Preferred time: {{webhook.callback_time}}",
        dueDate: "{{webhook.callback_due_date}}",
        assignedTo: "{{webhook.assigned_agent}}"
      },
      {
        type: "add_tag",
        tag: "Callback Requested"
      },
      {
        type: "add_tag",
        tag: "Solar Lead"
      }
    ]
  },

  // Not interested workflow
  notInterested: {
    name: "Solar Lead Not Interested",
    description: "Handles not interested responses from voice AI calls",
    trigger: {
      type: "webhook",
      name: "voice_ai_not_interested",
      webhookUrl: "{{webhook.base_url}}/ghl/not-interested",
      method: "POST"
    },
    actions: [
      {
        type: "update_contact",
        field: "call_outcome",
        value: "Not Interested"
      },
      {
        type: "update_contact",
        field: "solar_interest_level",
        value: "Not Interested"
      },
      {
        type: "update_contact",
        field: "last_call_date",
        value: "{{current_date}}"
      },
      {
        type: "add_tag",
        tag: "Not Interested"
      },
      {
        type: "add_tag",
        tag: "Do Not Call"
      },
      {
        type: "remove_tag",
        tag: "Solar Lead"
      }
    ]
  },

  // Wrong number workflow
  wrongNumber: {
    name: "Solar Lead Wrong Number",
    description: "Handles wrong number responses from voice AI calls",
    trigger: {
      type: "webhook",
      name: "voice_ai_wrong_number",
      webhookUrl: "{{webhook.base_url}}/ghl/wrong-number",
      method: "POST"
    },
    actions: [
      {
        type: "update_contact",
        field: "call_outcome",
        value: "Wrong Number"
      },
      {
        type: "add_tag",
        tag: "Wrong Number"
      },
      {
        type: "add_tag",
        tag: "Do Not Call"
      },
      {
        type: "create_note",
        content: "Contact marked as wrong number on {{current_date}}. Phone number: {{contact.phone}}"
      }
    ]
  },

  // Qualification update workflow
  qualificationUpdate: {
    name: "Solar Lead Qualification Update",
    description: "Updates lead qualification based on voice AI responses",
    trigger: {
      type: "webhook",
      name: "voice_ai_qualification_update",
      webhookUrl: "{{webhook.base_url}}/ghl/qualification-update",
      method: "POST"
    },
    actions: [
      {
        type: "update_contact",
        field: "solar_lead_score",
        value: "{{webhook.lead_score}}"
      },
      {
        type: "update_contact",
        field: "roof_type",
        value: "{{webhook.roof_type}}"
      },
      {
        type: "update_contact",
        field: "roof_age",
        value: "{{webhook.roof_age}}"
      },
      {
        type: "update_contact",
        field: "electric_bill",
        value: "{{webhook.electric_bill}}"
      },
      {
        type: "update_contact",
        field: "homeowner_status",
        value: "{{webhook.homeowner_status}}"
      },
      {
        type: "update_contact",
        field: "timeline",
        value: "{{webhook.timeline}}"
      },
      {
        type: "update_contact",
        field: "budget_range",
        value: "{{webhook.budget_range}}"
      },
      {
        type: "update_contact",
        field: "energy_goals",
        value: "{{webhook.energy_goals}}"
      },
      {
        type: "update_contact",
        field: "solar_qualification",
        value: "{{webhook.qualification_status}}"
      },
      {
        type: "create_note",
        content: "Lead qualification updated via voice AI on {{current_date}}. Lead score: {{webhook.lead_score}}, Roof type: {{webhook.roof_type}}, Electric bill: ${{webhook.electric_bill}}"
      }
    ]
  },

  // Voicemail left workflow
  voicemailLeft: {
    name: "Solar Lead Voicemail Left",
    description: "Handles voicemail left scenarios from voice AI calls",
    trigger: {
      type: "webhook",
      name: "voice_ai_voicemail_left",
      webhookUrl: "{{webhook.base_url}}/ghl/voicemail-left",
      method: "POST"
    },
    actions: [
      {
        type: "update_contact",
        field: "call_outcome",
        value: "Voicemail"
      },
      {
        type: "update_contact",
        field: "last_call_date",
        value: "{{current_date}}"
      },
      {
        type: "update_contact",
        field: "call_attempts",
        value: "{{contact.call_attempts + 1}}"
      },
      {
        type: "create_task",
        title: "Follow up with {{contact.firstName}} {{contact.lastName}}",
        description: "Voicemail left on {{current_date}}. Follow up in 2-3 days.",
        dueDate: "{{current_date + 2 days}}",
        assignedTo: "{{webhook.assigned_agent}}"
      },
      {
        type: "add_tag",
        tag: "Voicemail Left"
      },
      {
        type: "add_tag",
        tag: "Solar Lead"
      }
    ]
  },

  // Appointment reminder workflow
  appointmentReminder: {
    name: "Solar Appointment Reminder",
    description: "Sends appointment reminders before scheduled consultations",
    trigger: {
      type: "scheduled",
      schedule: "daily",
      time: "09:00"
    },
    conditions: [
      {
        field: "appointment_date",
        operator: "equals",
        value: "{{tomorrow_date}}"
      },
      {
        field: "call_outcome",
        operator: "equals",
        value: "Appointment Scheduled"
      }
    ],
    actions: [
      {
        type: "send_email",
        template: "appointment_reminder",
        to: "{{contact.email}}",
        subject: "Reminder: Your Solar Consultation Tomorrow",
        mergeTags: {
          "contact_name": "{{contact.firstName}} {{contact.lastName}}",
          "appointment_date": "{{appointment_date}}",
          "appointment_time": "{{appointment_time}}",
          "consultant_name": "{{consultant_name}}",
          "meeting_link": "{{meeting_link}}"
        }
      },
      {
        type: "send_sms",
        template: "appointment_reminder_sms",
        to: "{{contact.phone}}",
        message: "Hi {{contact.firstName}}! Just a reminder about your solar consultation tomorrow at {{appointment_time}}. {{meeting_link}} - Sarah"
      }
    ]
  },

  // Follow-up workflow for no answer
  followUpNoAnswer: {
    name: "Solar Lead Follow-up No Answer",
    description: "Follows up with leads who didn't answer initial calls",
    trigger: {
      type: "scheduled",
      schedule: "daily",
      time: "14:00"
    },
    conditions: [
      {
        field: "call_outcome",
        operator: "equals",
        value: "No Answer"
      },
      {
        field: "call_attempts",
        operator: "less_than",
        value: 3
      },
      {
        field: "last_call_date",
        operator: "less_than",
        value: "{{current_date - 2 days}}"
      }
    ],
    actions: [
      {
        type: "create_task",
        title: "Follow up call - {{contact.firstName}} {{contact.lastName}}",
        description: "Follow up call for solar lead. Previous attempts: {{contact.call_attempts}}",
        dueDate: "{{current_date + 1 day}}",
        assignedTo: "{{webhook.assigned_agent}}"
      },
      {
        type: "add_tag",
        tag: "Follow Up Needed"
      }
    ]
  }
};

// Pipeline and stage definitions
const PIPELINES = {
  solarSalesPipeline: {
    name: "Solar Sales Pipeline",
    stages: [
      {
        name: "Lead Generated",
        position: 1,
        color: "#3498db"
      },
      {
        name: "Appointment Scheduled",
        position: 2,
        color: "#f39c12"
      },
      {
        name: "Consultation Completed",
        position: 3,
        color: "#e67e22"
      },
      {
        name: "Proposal Sent",
        position: 4,
        color: "#e74c3c"
      },
      {
        name: "Negotiating",
        position: 5,
        color: "#9b59b6"
      },
      {
        name: "Closed Won",
        position: 6,
        color: "#27ae60"
      },
      {
        name: "Closed Lost",
        position: 7,
        color: "#95a5a6"
      }
    ]
  }
};

// Email templates
const EMAIL_TEMPLATES = {
  appointmentConfirmation: {
    name: "Solar Appointment Confirmation",
    subject: "Your Solar Consultation is Confirmed - {{appointment_date}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Your Solar Consultation is Confirmed!</h2>
        
        <p>Hi {{contact_name}},</p>
        
        <p>Thank you for your interest in solar energy! I'm excited to help you explore how solar can save you money on your electric bill.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #27ae60; margin-top: 0;">Appointment Details</h3>
          <p><strong>Date:</strong> {{appointment_date}}</p>
          <p><strong>Time:</strong> {{appointment_time}}</p>
          <p><strong>Type:</strong> {{appointment_type}}</p>
          <p><strong>Consultant:</strong> {{consultant_name}}</p>
          <p><strong>Phone:</strong> {{consultant_phone}}</p>
          {{#if meeting_link}}
          <p><strong>Meeting Link:</strong> <a href="{{meeting_link}}">{{meeting_link}}</a></p>
          {{/if}}
        </div>
        
        <p>During our consultation, I'll:</p>
        <ul>
          <li>Review your current energy usage and costs</li>
          <li>Assess your roof for solar potential</li>
          <li>Show you potential savings and payback period</li>
          <li>Discuss financing options and incentives</li>
          <li>Answer all your questions about solar</li>
        </ul>
        
        <p>If you need to reschedule, please call me at {{consultant_phone}} at least 24 hours in advance.</p>
        
        <p>I look forward to speaking with you soon!</p>
        
        <p>Best regards,<br>
        {{consultant_name}}<br>
        Solar Energy Consultant<br>
        {{company.name}}<br>
        {{consultant_phone}}</p>
      </div>
    `
  },
  
  appointmentReminder: {
    name: "Solar Appointment Reminder",
    subject: "Reminder: Your Solar Consultation Tomorrow",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Reminder: Your Solar Consultation Tomorrow</h2>
        
        <p>Hi {{contact_name}},</p>
        
        <p>This is a friendly reminder about your solar consultation tomorrow at {{appointment_time}}.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; margin-top: 0;">Appointment Details</h3>
          <p><strong>Date:</strong> {{appointment_date}}</p>
          <p><strong>Time:</strong> {{appointment_time}}</p>
          <p><strong>Type:</strong> {{appointment_type}}</p>
          {{#if meeting_link}}
          <p><strong>Meeting Link:</strong> <a href="{{meeting_link}}">{{meeting_link}}</a></p>
          {{/if}}
        </div>
        
        <p>I'm looking forward to showing you how solar can help you save money on your energy bills!</p>
        
        <p>If you need to reschedule, please call me at {{consultant_phone}} as soon as possible.</p>
        
        <p>See you tomorrow!</p>
        
        <p>Best regards,<br>
        {{consultant_name}}<br>
        Solar Energy Consultant</p>
      </div>
    `
  }
};

// SMS templates
const SMS_TEMPLATES = {
  appointmentSmsConfirmation: {
    name: "Appointment SMS Confirmation",
    message: "Hi {{contact.firstName}}! Your solar consultation is confirmed for {{appointment_date}} at {{appointment_time}}. {{meeting_link}} - Sarah from {{company.name}}"
  },
  
  appointmentReminderSms: {
    name: "Appointment Reminder SMS",
    message: "Hi {{contact.firstName}}! Just a reminder about your solar consultation tomorrow at {{appointment_time}}. {{meeting_link}} - Sarah"
  }
};

module.exports = {
  WORKFLOWS,
  PIPELINES,
  EMAIL_TEMPLATES,
  SMS_TEMPLATES
};
