import React from 'react';
import { Menu, Bell, Settings, User, Zap, Sun, Moon, Command } from 'lucide-react';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';
// import SearchBar from '../ui/SearchBar';
// import CommandPalette from '../ui/CommandPalette';

const Header: React.FC = () => {
  const { sidebarOpen, toggleSidebar, notifications, darkMode, toggleDarkMode } = useStore();
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* <CommandPalette isOpen={commandPaletteOpen} setIsOpen={setCommandPaletteOpen} /> */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-accent lg:hidden transition-all duration-200 hover:scale-105"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground gradient-text">
                GHL Voice AI Agent Planner
              </h2>
              <p className="text-sm text-muted-foreground">
                Build, configure, and deploy intelligent voice agents
              </p>
            </div>
          </div>
        </div>
        
        {/* Center - Search Bar */}
        {/* <div className="flex-1 mx-8 hidden md:block">
          <SearchBar />
        </div> */}

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {/* Command Palette */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-all duration-200 text-sm"
            title="Open command palette (Ctrl+P)"
          >
            <Command className="w-4 h-4" />
            <span className="text-xs text-muted-foreground">Ctrl+P</span>
          </button>
          
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md hover:bg-accent transition-all duration-200 hover:scale-105"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-md hover:bg-accent relative transition-all duration-200 hover:scale-105">
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </div>
          
          {/* Settings */}
          <button className="p-2 rounded-md hover:bg-accent transition-all duration-200 hover:scale-105">
            <Settings className="w-5 h-5" />
          </button>
          
          {/* User */}
          <button className="p-2 rounded-md hover:bg-accent transition-all duration-200 hover:scale-105">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;
