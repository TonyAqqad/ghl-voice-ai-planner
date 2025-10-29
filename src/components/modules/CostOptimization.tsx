import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Activity,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react';
import { useStore } from '../../store/useStore';

interface CostData {
  agentId: string;
  agentName: string;
  totalCost: number;
  callCount: number;
  averageCostPerCall: number;
  dailyBreakdown: Array<{
    date: string;
    cost: number;
    calls: number;
  }>;
  costBreakdown: {
    voice: number;
    llm: number;
    ghl: number;
  };
  trends: {
    weeklyChange: number;
    monthlyProjection: number;
  };
}

interface OptimizationSuggestion {
  id: string;
  type: 'voice' | 'llm' | 'workflow' | 'billing';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
}

const CostOptimization: React.FC = () => {
  const { voiceAgents, getAgentCosts, getAgentAnalytics } = useStore();
  const [costData, setCostData] = useState<CostData[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [dateRange, setDateRange] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [totalSavings, setTotalSavings] = useState(0);

  // Load cost data for all agents
  useEffect(() => {
    loadCostData();
  }, [dateRange, selectedAgent]);

  const loadCostData = async () => {
    setIsLoading(true);
    try {
      const promises = voiceAgents.map(async (agent) => {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
        
        const [costsResult, analyticsResult] = await Promise.all([
          getAgentCosts(agent.id, startDate, endDate),
          getAgentAnalytics(agent.id, startDate, endDate)
        ]);

        return {
          agentId: agent.id,
          agentName: agent.name,
          totalCost: costsResult.totalCost || 0,
          callCount: analyticsResult.totalCalls || 0,
          averageCostPerCall: costsResult.totalCost / Math.max(analyticsResult.totalCalls, 1),
          dailyBreakdown: costsResult.dailyBreakdown || [],
          costBreakdown: {
            voice: costsResult.voiceCost || 0,
            llm: costsResult.llmCost || 0,
            ghl: costsResult.ghlCost || 0
          },
          trends: {
            weeklyChange: costsResult.weeklyChange || 0,
            monthlyProjection: costsResult.monthlyProjection || 0
          }
        };
      });

      const results = await Promise.all(promises);
      setCostData(results);
      generateOptimizationSuggestions(results);
    } catch (error) {
      console.error('Failed to load cost data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateOptimizationSuggestions = (data: CostData[]) => {
    const newSuggestions: OptimizationSuggestion[] = [];

    data.forEach(agent => {
      // High voice costs
      if (agent.costBreakdown.voice > agent.totalCost * 0.6) {
        newSuggestions.push({
          id: `voice-${agent.agentId}`,
          type: 'voice',
          priority: 'high',
          title: 'Optimize Voice Settings',
          description: `${agent.agentName} has high voice costs. Consider reducing voice speed or switching to a more cost-effective voice.`,
          potentialSavings: agent.costBreakdown.voice * 0.2,
          effort: 'low'
        });
      }

      // High LLM costs
      if (agent.costBreakdown.llm > agent.totalCost * 0.4) {
        newSuggestions.push({
          id: `llm-${agent.agentId}`,
          type: 'llm',
          priority: 'medium',
          title: 'Optimize LLM Usage',
          description: `${agent.agentName} has high LLM costs. Consider reducing max tokens or using a more efficient model.`,
          potentialSavings: agent.costBreakdown.llm * 0.15,
          effort: 'medium'
        });
      }

      // Low call volume
      if (agent.callCount < 10 && agent.totalCost > 50) {
        newSuggestions.push({
          id: `workflow-${agent.agentId}`,
          type: 'workflow',
          priority: 'medium',
          title: 'Improve Call Volume',
          description: `${agent.agentName} has low call volume but high costs. Consider optimizing workflows to increase efficiency.`,
          potentialSavings: agent.totalCost * 0.3,
          effort: 'high'
        });
      }

      // High average cost per call
      if (agent.averageCostPerCall > 2.0) {
        newSuggestions.push({
          id: `billing-${agent.agentId}`,
          type: 'billing',
          priority: 'high',
          title: 'Reduce Cost Per Call',
          description: `${agent.agentName} has high cost per call ($${agent.averageCostPerCall.toFixed(2)}). Review conversation settings and optimize responses.`,
          potentialSavings: agent.totalCost * 0.25,
          effort: 'medium'
        });
      }
    });

    setSuggestions(newSuggestions);
    setTotalSavings(newSuggestions.reduce((sum, s) => sum + s.potentialSavings, 0));
  };

  const filteredData = selectedAgent === 'all' 
    ? costData 
    : costData.filter(d => d.agentId === selectedAgent);

  const totalCost = filteredData.reduce((sum, d) => sum + d.totalCost, 0);
  const totalCalls = filteredData.reduce((sum, d) => sum + d.callCount, 0);
  const averageCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Cost Optimization</h1>
            <p className="text-muted-foreground">
              Monitor and optimize Voice AI agent costs across all deployments
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadCostData}
              className="btn btn-outline"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="btn btn-outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
            <button className="btn btn-outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Agents</option>
              {voiceAgents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input w-full"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
              <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
              <p className="text-2xl font-bold">{totalCalls}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Cost/Call</p>
              <p className="text-2xl font-bold">${averageCostPerCall.toFixed(2)}</p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Potential Savings</p>
              <p className="text-2xl font-bold text-green-600">${totalSavings.toFixed(2)}</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Cost Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
          <div className="space-y-4">
            {filteredData.map(agent => (
              <div key={agent.agentId} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{agent.agentName}</span>
                  <span className="text-sm text-muted-foreground">${agent.totalCost.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="flex h-2 rounded-full">
                    <div 
                      className="bg-blue-500 h-2 rounded-l-full" 
                      style={{ width: `${(agent.costBreakdown.voice / agent.totalCost) * 100}%` }}
                    ></div>
                    <div 
                      className="bg-green-500 h-2" 
                      style={{ width: `${(agent.costBreakdown.llm / agent.totalCost) * 100}%` }}
                    ></div>
                    <div 
                      className="bg-purple-500 h-2 rounded-r-full" 
                      style={{ width: `${(agent.costBreakdown.ghl / agent.totalCost) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Voice: ${agent.costBreakdown.voice.toFixed(2)}</span>
                  <span>LLM: ${agent.costBreakdown.llm.toFixed(2)}</span>
                  <span>GHL: ${agent.costBreakdown.ghl.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Cost Trend</h3>
          <div className="space-y-4">
            {filteredData.length > 0 && filteredData[0].dailyBreakdown.slice(-7).map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(day.cost / Math.max(...filteredData[0].dailyBreakdown.map(d => d.cost))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">${day.cost.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Optimization Suggestions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Optimization Suggestions</h3>
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <p>No optimization suggestions at this time. Your costs are well optimized!</p>
            </div>
          ) : (
            suggestions.map(suggestion => (
              <div key={suggestion.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        suggestion.priority === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : suggestion.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {suggestion.priority} priority
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        suggestion.effort === 'low' 
                          ? 'bg-green-100 text-green-800' 
                          : suggestion.effort === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {suggestion.effort} effort
                      </span>
                    </div>
                    <h4 className="font-medium mb-1">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-green-600 font-medium">
                        Potential Savings: ${suggestion.potentialSavings.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn btn-outline btn-sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    <button className="btn btn-primary btn-sm">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CostOptimization;