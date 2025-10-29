/**
 * Template Service
 * Manages agent templates and knowledge base assets
 */

const fs = require('fs').promises;
const path = require('path');

class TemplateService {
  constructor(templatesPath = './templates') {
    this.templatesPath = templatesPath;
    this.templates = new Map();
    this.loadTemplates();
  }

  /**
   * Load templates from filesystem
   */
  async loadTemplates() {
    try {
      const files = await fs.readdir(this.templatesPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const filePath = path.join(this.templatesPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const template = JSON.parse(content);
        
        this.templates.set(template.id || file.replace('.json', ''), template);
      }
      
      console.log(`✅ Loaded ${this.templates.size} templates`);
    } catch (error) {
      console.warn('⚠️ Could not load templates:', error.message);
    }
  }

  /**
   * Get all templates
   */
  getAllTemplates() {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId) {
    return this.templates.get(templateId);
  }

  /**
   * Get templates by industry
   */
  getTemplatesByIndustry(industry) {
    return this.getAllTemplates().filter(template => 
      template.industry === industry || 
      template.tags?.includes(industry)
    );
  }

  /**
   * Get templates by business type
   */
  getTemplatesByBusinessType(businessType) {
    return this.getAllTemplates().filter(template => 
      template.businessType === businessType ||
      template.tags?.includes(businessType)
    );
  }

  /**
   * Create template from agent configuration
   */
  createTemplate(agentConfig, metadata = {}) {
    const template = {
      id: this.generateId(),
      name: agentConfig.name,
      description: agentConfig.description || '',
      industry: metadata.industry || 'general',
      businessType: metadata.businessType || 'service',
      tags: metadata.tags || [],
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: metadata.author || 'system',
      ...agentConfig
    };

    this.templates.set(template.id, template);
    return template;
  }

  /**
   * Update template
   */
  updateTemplate(templateId, updates) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.templates.set(templateId, updatedTemplate);
    return updatedTemplate;
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId) {
    return this.templates.delete(templateId);
  }

  /**
   * Clone template
   */
  cloneTemplate(templateId, newName, modifications = {}) {
    const originalTemplate = this.templates.get(templateId);
    if (!originalTemplate) {
      throw new Error(`Template ${templateId} not found`);
    }

    const clonedTemplate = {
      ...originalTemplate,
      id: this.generateId(),
      name: newName,
      description: `${originalTemplate.description} (Cloned)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...modifications
    };

    this.templates.set(clonedTemplate.id, clonedTemplate);
    return clonedTemplate;
  }

  /**
   * Export template to JSON
   */
  exportTemplate(templateId) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template from JSON
   */
  importTemplate(templateJson, overwrite = false) {
    const template = JSON.parse(templateJson);
    
    if (!overwrite && this.templates.has(template.id)) {
      throw new Error(`Template ${template.id} already exists`);
    }

    template.updatedAt = new Date().toISOString();
    this.templates.set(template.id, template);
    return template;
  }

  /**
   * Generate agent configuration from template
   */
  generateAgentConfig(templateId, customizations = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const agentConfig = {
      name: customizations.name || `${template.name} - ${new Date().toISOString().split('T')[0]}`,
      description: customizations.description || template.description,
      voiceSettings: {
        ...template.voiceSettings,
        ...customizations.voiceSettings
      },
      conversationSettings: {
        ...template.conversationSettings,
        ...customizations.conversationSettings
      },
      scripts: {
        ...template.scripts,
        ...customizations.scripts
      },
      intents: [
        ...(template.intents || []),
        ...(customizations.intents || [])
      ],
      transferRules: [
        ...(template.transferRules || []),
        ...(customizations.transferRules || [])
      ],
      compliance: {
        ...template.compliance,
        ...customizations.compliance
      },
      customActions: [
        ...(template.customActions || []),
        ...(customizations.customActions || [])
      ],
      knowledgeBase: [
        ...(template.knowledgeBase || []),
        ...(customizations.knowledgeBase || [])
      ]
    };

    return agentConfig;
  }

  /**
   * Search templates
   */
  searchTemplates(query) {
    const searchTerm = query.toLowerCase();
    
    return this.getAllTemplates().filter(template => 
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.industry.toLowerCase().includes(searchTerm) ||
      template.businessType.toLowerCase().includes(searchTerm) ||
      template.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get template statistics
   */
  getTemplateStats() {
    const templates = this.getAllTemplates();
    
    const stats = {
      total: templates.length,
      byIndustry: {},
      byBusinessType: {},
      byAuthor: {},
      recentlyUpdated: templates
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5)
    };

    templates.forEach(template => {
      // By industry
      if (!stats.byIndustry[template.industry]) {
        stats.byIndustry[template.industry] = 0;
      }
      stats.byIndustry[template.industry]++;

      // By business type
      if (!stats.byBusinessType[template.businessType]) {
        stats.byBusinessType[template.businessType] = 0;
      }
      stats.byBusinessType[template.businessType]++;

      // By author
      if (!stats.byAuthor[template.author]) {
        stats.byAuthor[template.author] = 0;
      }
      stats.byAuthor[template.author]++;
    });

    return stats;
  }

  /**
   * Validate template
   */
  validateTemplate(template) {
    const errors = [];

    if (!template.name) {
      errors.push('Template name is required');
    }

    if (!template.voiceSettings) {
      errors.push('Voice settings are required');
    }

    if (!template.conversationSettings) {
      errors.push('Conversation settings are required');
    }

    if (!template.scripts) {
      errors.push('Scripts are required');
    }

    if (!template.scripts.greeting) {
      errors.push('Greeting script is required');
    }

    if (!template.scripts.main) {
      errors.push('Main script is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Save templates to filesystem
   */
  async saveTemplates() {
    try {
      await fs.mkdir(this.templatesPath, { recursive: true });
      
      for (const [id, template] of this.templates) {
        const filePath = path.join(this.templatesPath, `${id}.json`);
        await fs.writeFile(filePath, JSON.stringify(template, null, 2));
      }
      
      console.log(`✅ Saved ${this.templates.size} templates`);
    } catch (error) {
      console.error('❌ Failed to save templates:', error.message);
      throw error;
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get template recommendations
   */
  getTemplateRecommendations(businessDescription, industry, businessType) {
    const templates = this.getAllTemplates();
    
    // Score templates based on relevance
    const scoredTemplates = templates.map(template => {
      let score = 0;
      
      // Industry match
      if (template.industry === industry) score += 10;
      if (template.tags?.includes(industry)) score += 5;
      
      // Business type match
      if (template.businessType === businessType) score += 10;
      if (template.tags?.includes(businessType)) score += 5;
      
      // Description keywords match
      const descriptionWords = businessDescription.toLowerCase().split(' ');
      const templateWords = (template.description + ' ' + template.name).toLowerCase().split(' ');
      
      const commonWords = descriptionWords.filter(word => 
        templateWords.includes(word) && word.length > 3
      );
      score += commonWords.length * 2;
      
      return { template, score };
    });

    return scoredTemplates
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.template);
  }
}

module.exports = TemplateService;
