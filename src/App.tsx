import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import HomePage from './components/modules/HomePage';
import VoiceAgentBuilder from './components/modules/VoiceAgentBuilder';
import AdvancedVoiceAgentBuilder from './components/modules/AdvancedVoiceAgentBuilder';
import IntelligentAutomationEngine from './components/modules/IntelligentAutomationEngine';
import RealTimeMonitoring from './components/modules/RealTimeMonitoring';
import AIOptimizationSuggestions from './components/modules/AIOptimizationSuggestions';
import AutomatedTestingSystem from './components/modules/AutomatedTestingSystem';
import OneClickDeployment from './components/modules/OneClickDeployment';
import ConversationAnalytics from './components/modules/ConversationAnalytics';
import AgentOptimizationEngine from './components/modules/AgentOptimizationEngine';
import MultiLanguageSupport from './components/modules/MultiLanguageSupport';
import SecurityComplianceMonitor from './components/modules/SecurityComplianceMonitor';
import AgentMarketplace from './components/modules/AgentMarketplace';
import WebhookAPIManager from './components/modules/WebhookAPIManager';
import TeamCollaboration from './components/modules/TeamCollaboration';
import BusinessIntelligence from './components/modules/BusinessIntelligence';
import AITemplateGenerator from './components/modules/AITemplateGenerator';
import GHLIntegrationValidator from './components/modules/GHLIntegrationValidator';
import CostOptimization from './components/modules/CostOptimization';
import ABTestingFramework from './components/modules/ABTestingFramework';
import PredictiveAnalytics from './components/modules/PredictiveAnalytics';
import ComplianceChecker from './components/modules/ComplianceChecker';
import PerformanceBenchmarking from './components/modules/PerformanceBenchmarking';
import WorkflowOrchestrationEngine from './components/modules/WorkflowOrchestrationEngine';
import ConversationSentimentAnalysis from './components/modules/ConversationSentimentAnalysis';
import AgentLearningSystem from './components/modules/AgentLearningSystem';
import VoiceCloningEngine from './components/modules/VoiceCloningEngine';
import MLPerformanceOptimization from './components/modules/MLPerformanceOptimization';
import VoiceAIDeployer from './components/modules/VoiceAIDeployer';
import WorkflowDesigner from './components/modules/WorkflowDesigner';
import TraditionalWorkflowCreator from './components/modules/TraditionalWorkflowCreator';
import AICustomActionWorkflowCreator from './components/modules/AICustomActionWorkflowCreator';
import WorkflowIntegration from './components/modules/WorkflowIntegration';
import PhoneSystemManager from './components/modules/PhoneSystemManager';
import CustomFieldsManager from './components/modules/CustomFieldsManager';
import IntegrationSetup from './components/modules/IntegrationSetup';
import TestingSimulator from './components/modules/TestingSimulator';
import QAGoldenPack from './components/modules/QAGoldenPack';
import TemplateLibrary from './components/modules/TemplateLibrary';
import AnalyticsDashboard from './components/modules/AnalyticsDashboard';
import ExportCenter from './components/modules/ExportCenter';
import GHLIntegrationHelper from './components/modules/GHLIntegrationHelper';
import ComplianceSafety from './components/modules/ComplianceSafety';
import VoiceTestingStudio from './components/modules/VoiceTestingStudio';
import AgentDeploymentDashboard from './components/modules/AgentDeploymentDashboard';
import CallAnalyticsDashboard from './components/modules/CallAnalyticsDashboard';
import WebhookConfigurationManager from './components/modules/WebhookConfigurationManager';
import PerformanceMonitorDashboard from './components/modules/PerformanceMonitorDashboard';
import TrainingHub from './components/modules/TrainingHub';
// GHL-Specific Components
import GHLVoiceAgentBuilder from './components/modules/GHLVoiceAgentBuilder';
import GHLWorkflowIntegration from './components/modules/GHLWorkflowIntegration';
import GHLAPIConnector from './components/modules/GHLAPIConnector';
import GHLContactSyncManager from './components/modules/GHLContactSyncManager';
import GHLCampaignManager from './components/modules/GHLCampaignManager';
import SMSMessaging from './components/modules/SMSMessaging';
import GHLAnalyticsDashboard from './components/modules/GHLAnalyticsDashboard';
import GHLVoiceAIDeployer from './components/modules/GHLVoiceAIDeployer';
import GHLOAuthCallback from './components/auth/GHLOAuthCallback';
import GHLWebhookHandler from './components/webhooks/GHLWebhookHandler';
import TemplateImporter from './components/TemplateImporter';
import GHLIntegrationManager from './components/modules/GHLIntegrationManager';
import RealTimeAgentMonitor from './components/modules/RealTimeAgentMonitor';
import ErrorBoundary from './components/ui/ErrorBoundary';
// import Breadcrumbs from './components/ui/Breadcrumbs';
import './styles/globals.css';
import NavBar from './components/ui/NavBar';

function App() {
  const { darkMode, sidebarOpen } = useStore();

  useEffect(() => {
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
        <div className={`min-h-screen bg-background ${darkMode ? 'dark' : ''}`}>
          <NavBar />
          <Routes future={{ v7_relativeSplatPath: true }}>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/ghl/callback" element={<GHLOAuthCallback />} />
            <Route path="/*" element={
              <ErrorBoundary>
              <div className="flex">
                {/* Sidebar */}
                <Sidebar />
                
                {/* Main Content */}
                <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
                  <Header />
                  
              <main className="p-6">
                {/* <Breadcrumbs /> */}
                    <Routes future={{ v7_relativeSplatPath: true }}>
                  <Route path="/voice-agents" element={<VoiceAgentBuilder />} />
                  <Route path="/voice-testing" element={<VoiceTestingStudio />} />
                  <Route path="/agent-dashboard" element={<AgentDeploymentDashboard />} />
                  <Route path="/call-analytics" element={<CallAnalyticsDashboard />} />
                  <Route path="/webhook-config" element={<WebhookConfigurationManager />} />
                  <Route path="/performance" element={<PerformanceMonitorDashboard />} />
                  <Route path="/advanced-agents" element={<AdvancedVoiceAgentBuilder />} />
                  <Route path="/automation" element={<IntelligentAutomationEngine />} />
                  <Route path="/monitoring" element={<RealTimeAgentMonitor />} />
                  <Route path="/optimization" element={<AIOptimizationSuggestions />} />
                  <Route path="/testing" element={<AutomatedTestingSystem />} />
                  <Route path="/deployment" element={<OneClickDeployment />} />
                  <Route path="/analytics" element={<ConversationAnalytics />} />
                  <Route path="/optimization-engine" element={<AgentOptimizationEngine />} />
                  <Route path="/languages" element={<MultiLanguageSupport />} />
                  <Route path="/security" element={<SecurityComplianceMonitor />} />
                  <Route path="/marketplace" element={<AgentMarketplace />} />
                  <Route path="/webhook-api" element={<WebhookAPIManager />} />
                  <Route path="/team" element={<TeamCollaboration />} />
                  <Route path="/business-intelligence" element={<BusinessIntelligence />} />
                  <Route path="/ai-template-generator" element={<AITemplateGenerator />} />
                  <Route path="/ghl-validator" element={<GHLIntegrationValidator />} />
                  <Route path="/cost-optimization" element={<CostOptimization />} />
                  <Route path="/ab-testing" element={<ABTestingFramework />} />
                  <Route path="/predictive-analytics" element={<PredictiveAnalytics />} />
                  <Route path="/compliance-checker" element={<ComplianceChecker />} />
                  <Route path="/performance-benchmarking" element={<PerformanceBenchmarking />} />
                  <Route path="/workflow-orchestration" element={<WorkflowOrchestrationEngine />} />
                  <Route path="/sentiment-analysis" element={<ConversationSentimentAnalysis />} />
                  <Route path="/agent-learning" element={<AgentLearningSystem />} />
                  <Route path="/voice-cloning" element={<VoiceCloningEngine />} />
                  <Route path="/ml-optimization" element={<MLPerformanceOptimization />} />
                  <Route path="/deployer" element={<VoiceAIDeployer />} />
                  <Route path="/workflows" element={<WorkflowDesigner />} />
                  <Route path="/traditional-workflows" element={<TraditionalWorkflowCreator />} />
                  <Route path="/ai-custom-actions" element={<AICustomActionWorkflowCreator />} />
                  <Route path="/workflow-integration" element={<WorkflowIntegration />} />
                  <Route path="/phone-system" element={<PhoneSystemManager />} />
                  <Route path="/custom-fields" element={<CustomFieldsManager />} />
                  <Route path="/integrations" element={<GHLIntegrationManager />} />
                  <Route path="/ghl-helper" element={<GHLIntegrationHelper />} />
                  <Route path="/compliance" element={<ComplianceChecker />} />
                  <Route path="/testing" element={<TestingSimulator />} />
                  <Route path="/qa-golden-pack" element={<QAGoldenPack />} />
                  <Route path="/templates" element={<TemplateLibrary />} />
                  <Route path="/analytics" element={<AnalyticsDashboard />} />
                  <Route path="/export" element={<ExportCenter />} />
                  <Route path="/compliance-safety" element={<ComplianceSafety />} />
                  <Route path="/training" element={<TrainingHub />} />
                  {/* GHL-Specific Routes */}
                  <Route path="/ghl-voice-agents" element={<GHLVoiceAgentBuilder />} />
                  <Route path="/ghl-workflows" element={<GHLWorkflowIntegration />} />
                  <Route path="/ghl-api" element={<GHLAPIConnector />} />
                  <Route path="/ghl-contact-sync" element={<GHLContactSyncManager />} />
                  <Route path="/sms-messaging" element={<SMSMessaging />} />
                  <Route path="/ghl-campaigns" element={<GHLCampaignManager />} />
                      <Route path="/ghl-analytics" element={<GHLAnalyticsDashboard />} />
                      <Route path="/ghl-deployer" element={<GHLVoiceAIDeployer />} />
                      <Route path="/ghl-webhooks" element={<GHLWebhookHandler />} />
                      <Route path="/template-importer" element={<TemplateImporter />} />
                      <Route path="/live-monitoring" element={<RealTimeAgentMonitor />} />
                    </Routes>
                  </main>
                </div>
              </div>
              </ErrorBoundary>
            } />
          </Routes>
        </div>
      );
    }

export default App;
