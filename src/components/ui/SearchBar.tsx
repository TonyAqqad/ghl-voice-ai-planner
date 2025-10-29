import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

interface SearchResult {
  type: 'page' | 'agent' | 'workflow' | 'template';
  title: string;
  description: string;
  href: string;
  icon?: string;
}

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const { voiceAgents, workflows } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  // Pre-define all available pages
  const allPages: SearchResult[] = [
    { type: 'page', title: 'Expert Templates', description: 'Import F45, Gracie Barra, Restaurant templates', href: '/template-importer' },
    { type: 'page', title: 'Voice Agents', description: 'Configure AI agents', href: '/voice-agents' },
    { type: 'page', title: 'Voice Testing', description: 'Test and preview voices', href: '/voice-testing' },
    { type: 'page', title: 'Agent Dashboard', description: 'Monitor deployed agents', href: '/agent-dashboard' },
    { type: 'page', title: 'Call Analytics', description: 'Detailed call performance', href: '/call-analytics' },
    { type: 'page', title: 'Webhook Config', description: 'Manage webhooks', href: '/webhook-config' },
    { type: 'page', title: 'Template Library', description: 'Browse all templates', href: '/templates' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
      
      if (event.key === 'Escape') {
        setIsOpen(false);
      }

      if (isOpen) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        }
        if (event.key === 'Enter' && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];

    // Search pages
    const pageResults = allPages.filter(page =>
      page.title.toLowerCase().includes(query.toLowerCase()) ||
      page.description.toLowerCase().includes(query.toLowerCase())
    );
    searchResults.push(...pageResults);

    // Search agents
    const agentResults = voiceAgents
      .filter(agent => agent.name.toLowerCase().includes(query.toLowerCase()))
      .map(agent => ({
        type: 'agent' as const,
        title: agent.name,
        description: `Voice agent • ${agent.voiceProvider} • ${agent.llmProvider}`,
        href: `/voice-agents/${agent.id}`,
      }));
    searchResults.push(...agentResults);

    // Search workflows
    const workflowResults = workflows
      .filter(workflow => workflow.name.toLowerCase().includes(query.toLowerCase()))
      .map(workflow => ({
        type: 'workflow' as const,
        title: workflow.name,
        description: workflow.description || 'Workflow automation',
        href: `/workflows/${workflow.id}`,
      }));
    searchResults.push(...workflowResults);

    setResults(searchResults.slice(0, 10));
  }, [query, voiceAgents, workflows]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.href);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm">Search...</span>
        <div className="flex items-center space-x-1 px-2 py-0.5 bg-muted rounded text-xs">
          <Command className="w-3 h-3" />
          <span>K</span>
        </div>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />
          <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50">
            <div className="bg-card border rounded-lg shadow-xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center space-x-3 px-4 py-3 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Search pages, agents, workflows..."
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-accent rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelect(result)}
                        className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start space-x-3 ${
                          index === selectedIndex ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mt-0.5">
                          <span className="text-xs font-semibold text-primary">
                            {result.type === 'page' ? 'P' : result.type === 'agent' ? 'A' : 'W'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground">{result.title}</div>
                          <div className="text-sm text-muted-foreground truncate">{result.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : query && results.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-muted-foreground">No results found</p>
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Type to search pages, agents, and workflows
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Hint */}
              <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span>↑↓ Navigate</span>
                  <span>↵ Select</span>
                  <span>ESC Close</span>
                </div>
                <span>{results.length} results</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchBar;

