import React, { useState, useEffect, useRef } from 'react';
import { Search, Zap, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface CommandAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'actions' | 'settings' | 'quick';
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, clearAllData } = useStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const paletteRef = useRef<HTMLDivElement>(null);

  const commands: CommandAction[] = [
    // Quick Actions
    {
      id: 'new-agent',
      label: 'Create New Agent',
      description: 'Start building a new voice AI agent',
      icon: <Zap className="w-4 h-4" />,
      category: 'quick',
      action: () => {
        navigate('/voice-agents');
        setIsOpen(false);
        toast.success('Redirecting to Voice Agents');
      }
    },
    {
      id: 'import-template',
      label: 'Import Expert Template',
      description: 'Import F45, Gracie Barra, or Restaurant templates',
      icon: <Zap className="w-4 h-4" />,
      category: 'quick',
      action: () => {
        navigate('/template-importer');
        setIsOpen(false);
      }
    },
    {
      id: 'deploy-agent',
      label: 'Deploy Agent',
      description: 'Deploy your voice agent to production',
      icon: <Zap className="w-4 h-4" />,
      category: 'quick',
      action: () => {
        navigate('/deployer');
        setIsOpen(false);
      }
    },
    
    // Navigation
    {
      id: 'dashboard',
      label: 'Agent Dashboard',
      description: 'Monitor deployed agents and performance',
      icon: <Search className="w-4 h-4" />,
      category: 'navigation',
      action: () => {
        navigate('/agent-dashboard');
        setIsOpen(false);
      }
    },
    {
      id: 'analytics',
      label: 'Call Analytics',
      description: 'View detailed call performance metrics',
      icon: <Search className="w-4 h-4" />,
      category: 'navigation',
      action: () => {
        navigate('/call-analytics');
        setIsOpen(false);
      }
    },
    {
      id: 'templates',
      label: 'Template Library',
      description: 'Browse industry-specific templates',
      icon: <Search className="w-4 h-4" />,
      category: 'navigation',
      action: () => {
        navigate('/templates');
        setIsOpen(false);
      }
    },
    
    // Settings
    {
      id: 'toggle-dark',
      label: darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      description: 'Toggle dark/light theme',
      icon: darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      category: 'settings',
      action: () => {
        toggleDarkMode();
        setIsOpen(false);
        toast.success(`Switched to ${darkMode ? 'light' : 'dark'} mode`);
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Open application settings',
      icon: <Settings className="w-4 h-4" />,
      category: 'settings',
      action: () => {
        setIsOpen(false);
        toast.success('Settings page coming soon');
      }
    },
    
    // Actions
    {
      id: 'export-data',
      label: 'Export Data',
      description: 'Export all your configurations',
      icon: <Search className="w-4 h-4" />,
      category: 'actions',
      action: () => {
        setIsOpen(false);
        toast.success('Export functionality coming soon');
      }
    },
    {
      id: 'clear-cache',
      label: 'Clear All Data',
      description: 'Remove all stored data (warning: cannot undo)',
      icon: <LogOut className="w-4 h-4" />,
      category: 'actions',
      action: () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
          clearAllData();
          setIsOpen(false);
          toast.success('All data cleared');
        }
      }
    },
  ];

  const filteredCommands = query
    ? commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandAction[]>);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
        event.preventDefault();
        setIsOpen(true);
      }
      
      if (event.key === 'Escape') {
        setIsOpen(false);
      }

      if (isOpen) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        }
        if (event.key === 'Enter' && filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, setIsOpen]);

  if (!isOpen) return null;

  let commandIndex = 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50">
        <div className="bg-card border rounded-lg shadow-xl overflow-hidden" ref={paletteRef}>
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
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            <div className="flex items-center space-x-2">
              <div className="px-2 py-0.5 bg-muted rounded text-xs">ESC</div>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const index = commandIndex++;
                  const isSelected = index === selectedIndex;
                  
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start space-x-3 ${
                        isSelected ? 'bg-accent' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                        {cmd.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground">{cmd.label}</div>
                        <div className="text-sm text-muted-foreground">{cmd.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <span>{filteredCommands.length} commands</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;

