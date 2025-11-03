/**
 * App Configuration
 * 
 * Fetches and caches server-side configuration for the client.
 * Hydrates window.__ENABLE_CONTEXT7_MEMORY__ for memory adapter.
 */

export interface AppConfig {
  enableContext7Memory: boolean;
  context7Available: boolean;
  environment: string;
}

declare global {
  interface Window {
    __ENABLE_CONTEXT7_MEMORY__?: boolean;
    __APP_CONFIG__?: AppConfig;
  }
}

let configCache: AppConfig | null = null;

/**
 * Get application configuration from server
 * Caches result to avoid repeated fetches
 */
export async function getAppConfig(): Promise<AppConfig> {
  // Return cached config if available
  if (configCache) return configCache;
  
  try {
    const response = await fetch('/api/config');
    
    if (!response.ok) {
      throw new Error(`Config fetch failed: ${response.status}`);
    }
    
    configCache = await response.json();
    
    // Hydrate window flag for memory adapter
    if (typeof window !== 'undefined' && configCache) {
      window.__ENABLE_CONTEXT7_MEMORY__ = configCache.enableContext7Memory;
      window.__APP_CONFIG__ = configCache;
    }
    
    console.log('📊 App config loaded:', {
      context7Memory: configCache.enableContext7Memory ? 'enabled' : 'disabled',
      context7Available: configCache.context7Available,
      environment: configCache.environment,
    });
    
    return configCache;
  } catch (error) {
    console.error('Failed to load app config:', error);
    
    // Return safe defaults
    const fallbackConfig: AppConfig = {
      enableContext7Memory: false,
      context7Available: false,
      environment: 'development',
    };
    
    configCache = fallbackConfig;
    
    if (typeof window !== 'undefined') {
      window.__ENABLE_CONTEXT7_MEMORY__ = false;
      window.__APP_CONFIG__ = fallbackConfig;
    }
    
    return fallbackConfig;
  }
}

/**
 * Get cached config (sync)
 * Returns null if config hasn't been loaded yet
 */
export function getCachedConfig(): AppConfig | null {
  return configCache;
}

/**
 * Reset config cache (useful for testing)
 */
export function resetConfigCache(): void {
  configCache = null;
  
  if (typeof window !== 'undefined') {
    delete window.__ENABLE_CONTEXT7_MEMORY__;
    delete window.__APP_CONFIG__;
  }
}

/**
 * Check if Context7 memory is enabled
 * Must call getAppConfig() first or will return false
 */
export function isContext7MemoryEnabled(): boolean {
  return configCache?.enableContext7Memory ?? false;
}

/**
 * Check if Context7 is available (API key configured)
 */
export function isContext7Available(): boolean {
  return configCache?.context7Available ?? false;
}

