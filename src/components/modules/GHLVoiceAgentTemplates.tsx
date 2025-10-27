import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Phone, 
  Settings, 
  Zap, 
  Play, 
  Pause, 
  Save, 
  Download, 
  Upload,
  Plus,
  Trash2,
  Edit3,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  BarChart3,
  Globe,
  Mic,
  Headphones,
  Volume2,
  MessageSquare,
  Calendar,
  Tag,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Wrench,
  Cog,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Power,
  PowerOff,
  Wifi,
  Signal,
  Database,
  Server,
  FileText,
  FileCheck,
  FileX,
  FileLock,
  FileSearch,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  FileJson,
  File,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Heart,
  Star,
  Award,
  Trophy,
  Medal,
  Crown,
  Flame,
  Rocket,
  Shield,
  CheckSquare,
  Square,
  Circle,
  Dot,
  Minus,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Move,
  GripVertical,
  GripHorizontal,
  MoreHorizontal,
  MoreVertical,
  Menu,
  XCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  MessageCircle,
  Lightbulb,
  BookOpen,
  Book,
  Bookmark,
  BookMarked,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Timer,
  Clock as Stopwatch,
  Hourglass,
  History,
  Archive,
  Inbox,
  Inbox as Outbox,
  Send,
  Reply,
  Forward,
  Share,
  Link,
  Link2,
  Unlink,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Key as KeyIcon,
  Shield as ShieldIcon,
  ShieldCheck,
  ShieldAlert,
  Shield as ShieldX,
  ShieldOff,
  CheckCircle2,
  XCircle as XCircleIcon,
  AlertCircle as AlertCircleIcon,
  Info as InfoIcon,
  HelpCircle as HelpCircleIcon,
  QuestionMarkCircle as QuestionMarkCircleIcon,
  Lightbulb as LightbulbIcon,
  BookOpen as BookOpenIcon,
  Book as BookIcon,
  Bookmark as BookmarkIcon,
  BookmarkCheck as BookmarkCheckIcon,
  Calendar as CalendarIcon2,
  Clock as ClockIcon2,
  Timer as TimerIcon,
  Stopwatch as StopwatchIcon,
  Hourglass as HourglassIcon,
  History as HistoryIcon,
  Archive as ArchiveIcon,
  Inbox as InboxIcon,
  Outbox as OutboxIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Share as ShareIcon,
  Link as LinkIcon,
  Link2 as Link2Icon,
  Unlink as UnlinkIcon,
  Lock as LockIcon2,
  Unlock as UnlockIcon2,
  Key as KeyIcon2,
  Shield as ShieldIcon2,
  ShieldCheck as ShieldCheckIcon,
  ShieldAlert as ShieldAlertIcon,
  ShieldX as ShieldXIcon,
  ShieldOff as ShieldOffIcon,
  Building2,
  Car,
  Home,
  Stethoscope,
  GraduationCap,
  ShoppingCart,
  CreditCard,
  Briefcase,
  Utensils,
  Coffee,
  Dumbbell,
  Scissors,
  Hammer,
  Paintbrush,
  Camera,
  Music,
  Gamepad2,
  Plane,
  Hotel,
  MapPin,
  PhoneCall,
  Mail,
  MessageCircle,    
  Share2,
  MoreVertical as MoreVerticalIcon,
  MoreHorizontal as MoreHorizontalIcon,
  ChevronUp,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  X as XIcon,
  Check as CheckIcon,
  AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon2,
  HelpCircle as HelpCircleIcon2,
  QuestionMarkCircle as QuestionMarkCircleIcon2,
  Lightbulb as LightbulbIcon2,
  BookOpen as BookOpenIcon2,
  Book as BookIcon2,
  Bookmark as BookmarkIcon2,
  BookmarkCheck as BookmarkCheckIcon2,
  Calendar as CalendarIcon3,
  Clock as ClockIcon3,
  Timer as TimerIcon2,
  Stopwatch as StopwatchIcon2,
  Hourglass as HourglassIcon2,
  History as HistoryIcon2,
  Archive as ArchiveIcon2,
  Inbox as InboxIcon2,
  Outbox as OutboxIcon2,
  Send as SendIcon2,
  Reply as ReplyIcon2,
  Forward as ForwardIcon2,
  Share as ShareIcon2,
  Link as LinkIcon2,
  Link2 as Link2Icon2,
  Unlink as UnlinkIcon2,
  Lock as LockIcon3,
  Unlock as UnlockIcon3,
  Key as KeyIcon3,
  Shield as ShieldIcon3,
  ShieldCheck as ShieldCheckIcon2,
  ShieldAlert as ShieldAlertIcon2,
  ShieldX as ShieldXIcon2,
  ShieldOff as ShieldOffIcon2,
  Grid3x3,
  Scale
} from 'lucide-react';

interface VoiceAgentTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: string;
  features: string[];
  voiceSettings: {
    provider: 'elevenlabs' | 'azure' | 'google' | 'aws';
    voiceId: string;
    voiceName: string;
    speed: number;
    pitch: number;
    stability: number;
    clarity: number;
  };
  conversationSettings: {
    model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'claude-2';
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    conversationMemory: boolean;
    contextWindow: number;
  };
  scripts: {
    greeting: string;
    main: string;
    fallback: string;
    transfer: string;
    goodbye: string;
    hold: string;
    error: string;
  };
  intents: Array<{
    name: string;
    description: string;
    phrases: string[];
    responses: string[];
    actions: string[];
  }>;
  ghlIntegration: {
    customFields: Array<{
      fieldName: string;
      fieldValue: string;
      isRequired: boolean;
    }>;
    tags: string[];
    followUpActions: Array<{
      trigger: string;
      action: string;
      delay: number;
    }>;
    workflows: Array<{
      name: string;
      trigger: string;
      actions: string[];
    }>;
  };
  compliance: {
    tcpaCompliant: boolean;
    gdprCompliant: boolean;
    recordingConsent: boolean;
    dncListCheck: boolean;
    consentScript: string;
  };
  pricing: {
    setupCost: number;
    monthlyCost: number;
    perCallCost: number;
    currency: string;
  };
  rating: number;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

const GHLVoiceAgentTemplates: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [templates, setTemplates] = useState<VoiceAgentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<VoiceAgentTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Sample data
  useEffect(() => {
    setTemplates([
      {
        id: '1',
        name: 'F45 Fitness Sales Agent',
        description: 'High-converting sales agent for F45 fitness classes with appointment booking and lead qualification',
        industry: 'fitness',
        category: 'sales',
        difficulty: 'intermediate',
        estimatedSetupTime: '30 minutes',
        features: [
          'Appointment Booking',
          'Lead Qualification',
          'Pricing Information',
          'Class Scheduling',
          'Membership Sales',
          'Follow-up Automation'
        ],
        voiceSettings: {
          provider: 'elevenlabs',
          voiceId: 'voice_001',
          voiceName: 'Sarah',
          speed: 1.0,
          pitch: 1.0,
          stability: 0.8,
          clarity: 0.9
        },
        conversationSettings: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'You are a friendly, energetic sales agent for F45 Training. Your goal is to book fitness class appointments and convert leads into members.',
          conversationMemory: true,
          contextWindow: 10
        },
        scripts: {
          greeting: 'Hi! This is Sarah from F45 Training. I\'m calling because you expressed interest in trying our high-intensity fitness classes.',
          main: 'I\'d love to help you find the perfect class time. What works best for your schedule?',
          fallback: 'I\'m sorry, I didn\'t catch that. Could you repeat that for me?',
          transfer: 'Let me connect you with one of our fitness experts who can help you better.',
          goodbye: 'Thanks for your time! I\'ll send you a text with our class schedule. Have a great day!',
          hold: 'Please hold while I check our availability for you.',
          error: 'I apologize, but I\'m having trouble processing that. Let me transfer you to a human representative.'
        },
        intents: [
          {
            name: 'book_appointment',
            description: 'Customer wants to book a fitness class',
            phrases: ['book a class', 'schedule appointment', 'when can I come in'],
            responses: ['Great! Let me check our availability for you.'],
            actions: ['check_calendar', 'book_appointment']
          },
          {
            name: 'pricing_inquiry',
            description: 'Customer asks about pricing',
            phrases: ['how much does it cost', 'what are your prices', 'membership fees'],
            responses: ['Our classes start at $15 per class, but we have great membership packages available.'],
            actions: ['explain_pricing', 'offer_discount']
          }
        ],
        ghlIntegration: {
          customFields: [
            { fieldName: 'fitness_goals', fieldValue: 'Weight Loss', isRequired: true },
            { fieldName: 'experience_level', fieldValue: 'Beginner', isRequired: false }
          ],
          tags: ['fitness', 'sales', 'high-priority'],
          followUpActions: [
            { trigger: 'appointment_booked', action: 'send_confirmation_email', delay: 0 },
            { trigger: 'no_show', action: 'reschedule_call', delay: 24 }
          ],
          workflows: [
            {
              name: 'Lead Qualification',
              trigger: 'transcript_generated',
              actions: ['add_tag', 'update_field', 'create_opportunity']
            }
          ]
        },
        compliance: {
          tcpaCompliant: true,
          gdprCompliant: true,
          recordingConsent: true,
          dncListCheck: true,
          consentScript: 'This call may be recorded for quality and training purposes.'
        },
        pricing: {
          setupCost: 0,
          monthlyCost: 0,
          perCallCost: 0.85,
          currency: 'USD'
        },
        rating: 4.8,
        downloads: 1250,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Legal Consultation Agent',
        description: 'Professional legal consultation agent for law firms with case intake and appointment scheduling',
        industry: 'legal',
        category: 'consultation',
        difficulty: 'advanced',
        estimatedSetupTime: '45 minutes',
        features: [
          'Case Intake',
          'Appointment Scheduling',
          'Legal Consultation',
          'Document Collection',
          'Client Onboarding',
          'Compliance Management'
        ],
        voiceSettings: {
          provider: 'azure',
          voiceId: 'voice_002',
          voiceName: 'David',
          speed: 0.9,
          pitch: 0.8,
          stability: 0.9,
          clarity: 0.95
        },
        conversationSettings: {
          model: 'gpt-4',
          temperature: 0.5,
          maxTokens: 1500,
          systemPrompt: 'You are a professional legal consultation agent. You help potential clients understand legal services and schedule consultations with qualified attorneys.',
          conversationMemory: true,
          contextWindow: 15
        },
        scripts: {
          greeting: 'Good day, this is David from Legal Solutions. I\'m calling regarding your consultation request.',
          main: 'I understand you\'re seeking legal advice. What type of legal matter can I help you with today?',
          fallback: 'I apologize, could you please clarify that for me?',
          transfer: 'Let me connect you with one of our qualified attorneys who specializes in your area of need.',
          goodbye: 'Thank you for your time. We\'ll follow up with you shortly. Have a good day.',
          hold: 'Please hold while I review your case details.',
          error: 'I apologize, but I\'m having trouble processing that. Let me transfer you to a human representative.'
        },
        intents: [
          {
            name: 'case_intake',
            description: 'Client provides case details',
            phrases: ['I need help with', 'my case involves', 'I have a legal issue'],
            responses: ['I understand. Let me gather some details about your case.'],
            actions: ['collect_case_details', 'schedule_consultation']
          },
          {
            name: 'appointment_scheduling',
            description: 'Client wants to schedule consultation',
            phrases: ['schedule appointment', 'when can I meet', 'book consultation'],
            responses: ['I\'d be happy to schedule a consultation for you.'],
            actions: ['check_availability', 'book_appointment']
          }
        ],
        ghlIntegration: {
          customFields: [
            { fieldName: 'legal_matter_type', fieldValue: 'Personal Injury', isRequired: true },
            { fieldName: 'case_urgency', fieldValue: 'High', isRequired: false }
          ],
          tags: ['legal', 'consultation', 'high-value'],
          followUpActions: [
            { trigger: 'consultation_booked', action: 'send_legal_forms', delay: 0 },
            { trigger: 'case_qualified', action: 'assign_attorney', delay: 2 }
          ],
          workflows: [
            {
              name: 'Case Intake',
              trigger: 'transcript_generated',
              actions: ['add_tag', 'update_field', 'create_opportunity']
            }
          ]
        },
        compliance: {
          tcpaCompliant: true,
          gdprCompliant: true,
          recordingConsent: true,
          dncListCheck: true,
          consentScript: 'This call may be recorded for quality and training purposes.'
        },
        pricing: {
          setupCost: 0,
          monthlyCost: 0,
          perCallCost: 1.25,
          currency: 'USD'
        },
        rating: 4.9,
        downloads: 890,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    ]);
  }, []);

  const tabs = [
    { id: 'all', label: 'All Templates', icon: Grid3X3 },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell },
    { id: 'legal', label: 'Legal', icon: Scale },
    { id: 'healthcare', label: 'Healthcare', icon: Stethoscope },
    { id: 'real-estate', label: 'Real Estate', icon: Home },
    { id: 'automotive', label: 'Automotive', icon: Car },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'retail', label: 'Retail', icon: ShoppingCart },
    { id: 'finance', label: 'Finance', icon: CreditCard },
    { id: 'beauty', label: 'Beauty', icon: Scissors },
    { id: 'food', label: 'Food & Beverage', icon: Utensils },
    { id: 'travel', label: 'Travel', icon: Plane },
    { id: 'hospitality', label: 'Hospitality', icon: Hotel }
  ];

  const industries = [
    { id: 'all', label: 'All Industries', icon: Grid3X3 },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell },
    { id: 'legal', label: 'Legal', icon: Scale },
    { id: 'healthcare', label: 'Healthcare', icon: Stethoscope },
    { id: 'real-estate', label: 'Real Estate', icon: Home },
    { id: 'automotive', label: 'Automotive', icon: Car },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'retail', label: 'Retail', icon: ShoppingCart },
    { id: 'finance', label: 'Finance', icon: CreditCard },
    { id: 'beauty', label: 'Beauty', icon: Scissors },
    { id: 'food', label: 'Food & Beverage', icon: Utensils },
    { id: 'travel', label: 'Travel', icon: Plane },
    { id: 'hospitality', label: 'Hospitality', icon: Hotel }
  ];

  const difficulties = [
    { id: 'all', label: 'All Levels', color: 'text-gray-500' },
    { id: 'beginner', label: 'Beginner', color: 'text-green-500' },
    { id: 'intermediate', label: 'Intermediate', color: 'text-yellow-500' },
    { id: 'advanced', label: 'Advanced', color: 'text-red-500' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = filterIndustry === 'all' || template.industry === filterIndustry;
    const matchesDifficulty = filterDifficulty === 'all' || template.difficulty === filterDifficulty;
    
    return matchesSearch && matchesIndustry && matchesDifficulty;
  });

  const handlePreviewTemplate = (template: VoiceAgentTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewing(true);
  };

  const handleUseTemplate = (template: VoiceAgentTemplate) => {
    console.log('Using template:', template.name);
    // Implementation for using template
  };

  const handleDownloadTemplate = (template: VoiceAgentTemplate) => {
    console.log('Downloading template:', template.name);
    // Implementation for downloading template
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">GHL Voice Agent Templates</h1>
            <p className="text-muted-foreground">
              Pre-built Voice AI agents optimized for GoHighLevel integration
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="btn btn-outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload Template
            </button>
            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Custom
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {industries.map(industry => (
                <option key={industry.id} value={industry.id}>{industry.label}</option>
              ))}
            </select>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty.id} value={difficulty.id}>{difficulty.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.industry}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  template.difficulty === 'beginner' 
                    ? 'bg-green-100 text-green-800' 
                    : template.difficulty === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {template.difficulty}
                </span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{template.rating}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{template.description}</p>

            {/* Features */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {template.features.slice(0, 3).map((feature, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {feature}
                  </span>
                ))}
                {template.features.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    +{template.features.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{template.downloads}</div>
                <div className="text-xs text-muted-foreground">Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{template.estimatedSetupTime}</div>
                <div className="text-xs text-muted-foreground">Setup Time</div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Per Call Cost</span>
                <span className="font-medium">${template.pricing.perCallCost}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handlePreviewTemplate(template)}
                className="flex-1 btn btn-outline btn-sm"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </button>
              <button
                onClick={() => handleUseTemplate(template)}
                className="flex-1 btn btn-primary btn-sm"
              >
                <Zap className="w-4 h-4 mr-1" />
                Use
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
              <p className="text-2xl font-bold">{templates.length}</p>
            </div>
            <Bot className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Industries</p>
              <p className="text-2xl font-bold">{industries.length - 1}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
              <p className="text-2xl font-bold">{templates.reduce((sum, t) => sum + t.downloads, 0)}</p>
            </div>
            <Download className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold">
                {(templates.reduce((sum, t) => sum + t.rating, 0) / templates.length).toFixed(1)}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">F45 Fitness Sales Agent template downloaded</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">New template created: Healthcare Consultation</p>
              <p className="text-xs text-muted-foreground">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Legal Consultation Agent rated 5 stars</p>
              <p className="text-xs text-muted-foreground">6 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GHLVoiceAgentTemplates;
