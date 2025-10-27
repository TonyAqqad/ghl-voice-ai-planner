import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Languages, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Settings, 
  RefreshCw, 
  Download, 
  Upload, 
  Save, 
  Edit, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Filter, 
  Search, 
  SortAsc, 
  SortDesc, 
  MoreHorizontal, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Heart, 
  Smile, 
  Frown, 
  Meh, 
  Award, 
  Trophy, 
  Medal, 
  Crown, 
  Flame, 
  Lightning, 
  Rocket, 
  Shield, 
  Lock, 
  Unlock, 
  Key, 
  Wrench, 
  Cog, 
  Sliders, 
  ToggleLeft, 
  ToggleRight, 
  Switch, 
  Power, 
  PowerOff, 
  Battery, 
  BatteryCharging, 
  Wifi, 
  WifiOff, 
  Signal, 
  SignalZero, 
  SignalOne, 
  SignalTwo, 
  SignalThree, 
  SignalFour, 
  SignalFive,
  Mic,
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Clock,
  Users,
  Phone,
  Bot,
  Brain,
  Zap,
  Target,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

interface Language {
  id: string;
  name: string;
  code: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
  status: 'active' | 'inactive' | 'testing' | 'pending';
  coverage: number;
  lastUpdated: string;
  translator: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface Translation {
  id: string;
  key: string;
  category: 'ui' | 'scripts' | 'responses' | 'errors' | 'notifications';
  language: string;
  originalText: string;
  translatedText: string;
  status: 'translated' | 'pending' | 'review' | 'approved' | 'rejected';
  confidence: number;
  translator: string;
  reviewer: string;
  createdAt: string;
  updatedAt: string;
  context: string;
  notes: string;
  tags: string[];
}

interface AgentLanguageConfig {
  agentId: string;
  agentName: string;
  primaryLanguage: string;
  supportedLanguages: string[];
  autoDetect: boolean;
  fallbackLanguage: string;
  voiceSettings: Record<string, {
    voiceId: string;
    speed: number;
    pitch: number;
    accent: string;
  }>;
  culturalAdaptations: Record<string, {
    greeting: string;
    politeness: string;
    formality: string;
    humor: string;
    directness: string;
  }>;
}

interface TranslationProject {
  id: string;
  name: string;
  description: string;
  sourceLanguage: string;
  targetLanguages: string[];
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  progress: number;
  totalKeys: number;
  translatedKeys: number;
  reviewedKeys: number;
  createdAt: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  budget: number;
  assignedTranslators: string[];
}

const MultiLanguageSupport: React.FC = () => {
  const { darkMode } = useStore();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [agentConfigs, setAgentConfigs] = useState<AgentLanguageConfig[]>([]);
  const [projects, setProjects] = useState<TranslationProject[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'languages' | 'translations' | 'agents' | 'projects'>('overview');

  // Sample data - in real app this would come from localization API
  useEffect(() => {
    const sampleLanguages: Language[] = [
      {
        id: 'en',
        name: 'English',
        code: 'en',
        nativeName: 'English',
        flag: '🇺🇸',
        rtl: false,
        status: 'active',
        coverage: 100,
        lastUpdated: '2024-01-15T10:00:00Z',
        translator: 'System',
        quality: 'excellent'
      },
      {
        id: 'es',
        name: 'Spanish',
        code: 'es',
        nativeName: 'Español',
        flag: '🇪🇸',
        rtl: false,
        status: 'active',
        coverage: 95,
        lastUpdated: '2024-01-15T09:30:00Z',
        translator: 'Maria Rodriguez',
        quality: 'excellent'
      },
      {
        id: 'fr',
        name: 'French',
        code: 'fr',
        nativeName: 'Français',
        flag: '🇫🇷',
        rtl: false,
        status: 'active',
        coverage: 88,
        lastUpdated: '2024-01-14T16:45:00Z',
        translator: 'Pierre Dubois',
        quality: 'good'
      },
      {
        id: 'de',
        name: 'German',
        code: 'de',
        nativeName: 'Deutsch',
        flag: '🇩🇪',
        rtl: false,
        status: 'testing',
        coverage: 75,
        lastUpdated: '2024-01-14T14:20:00Z',
        translator: 'Hans Mueller',
        quality: 'good'
      },
      {
        id: 'zh',
        name: 'Chinese (Simplified)',
        code: 'zh-CN',
        nativeName: '简体中文',
        flag: '🇨🇳',
        rtl: false,
        status: 'active',
        coverage: 82,
        lastUpdated: '2024-01-13T11:15:00Z',
        translator: 'Li Wei',
        quality: 'good'
      },
      {
        id: 'ja',
        name: 'Japanese',
        code: 'ja',
        nativeName: '日本語',
        flag: '🇯🇵',
        rtl: false,
        status: 'pending',
        coverage: 45,
        lastUpdated: '2024-01-12T08:30:00Z',
        translator: 'Yuki Tanaka',
        quality: 'fair'
      },
      {
        id: 'ar',
        name: 'Arabic',
        code: 'ar',
        nativeName: 'العربية',
        flag: '🇸🇦',
        rtl: true,
        status: 'testing',
        coverage: 60,
        lastUpdated: '2024-01-11T15:45:00Z',
        translator: 'Ahmed Al-Rashid',
        quality: 'fair'
      }
    ];

    const sampleTranslations: Translation[] = [
      {
        id: 'trans_1',
        key: 'greeting.fitness',
        category: 'scripts',
        language: 'es',
        originalText: 'Hi! This is Alex from F45 Training. I\'m calling because you expressed interest in trying our classes.',
        translatedText: '¡Hola! Soy Alex de F45 Training. Te llamo porque expresaste interés en probar nuestras clases.',
        status: 'approved',
        confidence: 0.95,
        translator: 'Maria Rodriguez',
        reviewer: 'Carlos Mendez',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:30:00Z',
        context: 'F45 Fitness Agent greeting script',
        notes: 'Cultural adaptation: More friendly and personal tone',
        tags: ['fitness', 'greeting', 'trial']
      },
      {
        id: 'trans_2',
        key: 'greeting.fitness',
        category: 'scripts',
        language: 'fr',
        originalText: 'Hi! This is Alex from F45 Training. I\'m calling because you expressed interest in trying our classes.',
        translatedText: 'Bonjour ! Je suis Alex de F45 Training. Je vous appelle car vous avez exprimé votre intérêt pour essayer nos cours.',
        status: 'review',
        confidence: 0.88,
        translator: 'Pierre Dubois',
        reviewer: '',
        createdAt: '2024-01-14T16:00:00Z',
        updatedAt: '2024-01-14T16:45:00Z',
        context: 'F45 Fitness Agent greeting script',
        notes: 'Formal tone appropriate for French business context',
        tags: ['fitness', 'greeting', 'trial']
      },
      {
        id: 'trans_3',
        key: 'error.network',
        category: 'errors',
        language: 'es',
        originalText: 'Sorry, I\'m experiencing technical difficulties. Please try again later.',
        translatedText: 'Lo siento, estoy experimentando dificultades técnicas. Por favor, inténtalo de nuevo más tarde.',
        status: 'translated',
        confidence: 0.92,
        translator: 'Maria Rodriguez',
        reviewer: '',
        createdAt: '2024-01-15T08:30:00Z',
        updatedAt: '2024-01-15T08:30:00Z',
        context: 'Network error message',
        notes: '',
        tags: ['error', 'network', 'technical']
      }
    ];

    const sampleAgentConfigs: AgentLanguageConfig[] = [
      {
        agentId: 'agent_1',
        agentName: 'F45 Fitness Agent',
        primaryLanguage: 'en',
        supportedLanguages: ['en', 'es', 'fr', 'de'],
        autoDetect: true,
        fallbackLanguage: 'en',
        voiceSettings: {
          'en': { voiceId: 'en-US-AriaNeural', speed: 1.0, pitch: 1.0, accent: 'american' },
          'es': { voiceId: 'es-ES-ElviraNeural', speed: 1.0, pitch: 1.0, accent: 'spain' },
          'fr': { voiceId: 'fr-FR-DeniseNeural', speed: 1.0, pitch: 1.0, accent: 'france' },
          'de': { voiceId: 'de-DE-KatjaNeural', speed: 1.0, pitch: 1.0, accent: 'germany' }
        },
        culturalAdaptations: {
          'en': { greeting: 'casual', politeness: 'moderate', formality: 'informal', humor: 'friendly', directness: 'high' },
          'es': { greeting: 'warm', politeness: 'high', formality: 'moderate', humor: 'playful', directness: 'moderate' },
          'fr': { greeting: 'formal', politeness: 'very_high', formality: 'formal', humor: 'sophisticated', directness: 'low' },
          'de': { greeting: 'professional', politeness: 'high', formality: 'formal', humor: 'subtle', directness: 'high' }
        }
      },
      {
        agentId: 'agent_2',
        agentName: 'Legal Consultation Agent',
        primaryLanguage: 'en',
        supportedLanguages: ['en', 'es', 'fr'],
        autoDetect: false,
        fallbackLanguage: 'en',
        voiceSettings: {
          'en': { voiceId: 'en-US-GuyNeural', speed: 0.9, pitch: 0.9, accent: 'american' },
          'es': { voiceId: 'es-ES-AlvaroNeural', speed: 0.9, pitch: 0.9, accent: 'spain' },
          'fr': { voiceId: 'fr-FR-HenriNeural', speed: 0.9, pitch: 0.9, accent: 'france' }
        },
        culturalAdaptations: {
          'en': { greeting: 'professional', politeness: 'high', formality: 'formal', humor: 'minimal', directness: 'high' },
          'es': { greeting: 'respectful', politeness: 'very_high', formality: 'formal', humor: 'none', directness: 'moderate' },
          'fr': { greeting: 'formal', politeness: 'very_high', formality: 'very_formal', humor: 'none', directness: 'low' }
        }
      }
    ];

    const sampleProjects: TranslationProject[] = [
      {
        id: 'proj_1',
        name: 'F45 Fitness Agent - Spanish Translation',
        description: 'Complete translation of F45 Fitness Agent scripts and responses to Spanish',
        sourceLanguage: 'en',
        targetLanguages: ['es'],
        status: 'active',
        progress: 85,
        totalKeys: 120,
        translatedKeys: 102,
        reviewedKeys: 95,
        createdAt: '2024-01-10T09:00:00Z',
        deadline: '2024-01-20T17:00:00Z',
        priority: 'high',
        budget: 2500,
        assignedTranslators: ['Maria Rodriguez', 'Carlos Mendez']
      },
      {
        id: 'proj_2',
        name: 'Legal Agent - Multi-Language Support',
        description: 'Translation of Legal Consultation Agent to French and German',
        sourceLanguage: 'en',
        targetLanguages: ['fr', 'de'],
        status: 'active',
        progress: 60,
        totalKeys: 80,
        translatedKeys: 48,
        reviewedKeys: 35,
        createdAt: '2024-01-12T14:00:00Z',
        deadline: '2024-01-25T17:00:00Z',
        priority: 'medium',
        budget: 4000,
        assignedTranslators: ['Pierre Dubois', 'Hans Mueller']
      }
    ];

    setLanguages(sampleLanguages);
    setTranslations(sampleTranslations);
    setAgentConfigs(sampleAgentConfigs);
    setProjects(sampleProjects);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-100';
      case 'inactive': return 'text-gray-400 bg-gray-100';
      case 'testing': return 'text-blue-400 bg-blue-100';
      case 'pending': return 'text-yellow-400 bg-yellow-100';
      case 'translated': return 'text-green-400 bg-green-100';
      case 'review': return 'text-yellow-400 bg-yellow-100';
      case 'approved': return 'text-green-400 bg-green-100';
      case 'rejected': return 'text-red-400 bg-red-100';
      case 'completed': return 'text-green-400 bg-green-100';
      case 'paused': return 'text-yellow-400 bg-yellow-100';
      case 'cancelled': return 'text-red-400 bg-red-100';
      default: return 'text-gray-400 bg-gray-100';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-100';
      case 'high': return 'text-orange-400 bg-orange-100';
      case 'medium': return 'text-yellow-400 bg-yellow-100';
      case 'low': return 'text-green-400 bg-green-100';
      default: return 'text-gray-400 bg-gray-100';
    }
  };

  const handleTranslate = (translationId: string) => {
    setIsTranslating(true);
    toast.success('Starting translation...');
    
    // Simulate translation process
    setTimeout(() => {
      setIsTranslating(false);
      toast.success('Translation completed!');
    }, 2000);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Language Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Languages</p>
              <p className="text-2xl font-bold text-foreground">{languages.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Languages</p>
              <p className="text-2xl font-bold text-foreground">
                {languages.filter(l => l.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Translations</p>
              <p className="text-2xl font-bold text-foreground">{translations.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-bold text-foreground">
                {projects.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Language Coverage */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Language Coverage</h2>
        <div className="space-y-4">
          {languages.map((language) => (
            <div key={language.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="text-2xl">{language.flag}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{language.name}</h3>
                  <p className="text-sm text-muted-foreground">{language.nativeName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">Coverage</p>
                  <p className="text-lg font-bold text-primary">{language.coverage}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">Quality</p>
                  <p className={`text-lg font-bold ${getQualityColor(language.quality)}`}>
                    {language.quality}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(language.status)}`}>
                  {language.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLanguagesTab = () => (
    <div className="space-y-6">
      {/* Language Management */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Language Management</h2>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Language
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {languages.map((language) => (
            <div key={language.id} className="bg-secondary p-6 rounded-lg hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{language.flag}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{language.name}</h3>
                    <p className="text-sm text-muted-foreground">{language.nativeName}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(language.status)}`}>
                  {language.status}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coverage</span>
                  <span className="font-medium">{language.coverage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${language.coverage}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quality</span>
                  <span className={`font-medium ${getQualityColor(language.quality)}`}>
                    {language.quality}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Translator</span>
                  <span className="font-medium">{language.translator}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {new Date(language.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <button className="btn btn-outline btn-sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Multi-Language Support</h1>
            <p className="text-muted-foreground">
              Comprehensive localization and translation management for voice AI agents
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="btn btn-outline">
              <Download className="w-4 h-4 mr-2" />
              Export Translations
            </button>
            <button className="btn btn-outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Translations
            </button>
            <button className="btn btn-primary">
              <MessageSquare className="w-4 h-4 mr-2" />
              Auto-Translate
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-secondary p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'languages', label: 'Languages', icon: Globe },
            { id: 'translations', label: 'Translations', icon: MessageSquare },
            { id: 'agents', label: 'Agents', icon: Bot },
            { id: 'projects', label: 'Projects', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'languages' && renderLanguagesTab()}
      {activeTab === 'translations' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Translation Management</h2>
          <p className="text-muted-foreground">Translation interface will be displayed here.</p>
        </div>
      )}
      {activeTab === 'agents' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Agent Language Configuration</h2>
          <p className="text-muted-foreground">Agent language settings will be displayed here.</p>
        </div>
      )}
      {activeTab === 'projects' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Translation Projects</h2>
          <p className="text-muted-foreground">Project management interface will be displayed here.</p>
        </div>
      )}
    </div>
  );
};

export default MultiLanguageSupport;
