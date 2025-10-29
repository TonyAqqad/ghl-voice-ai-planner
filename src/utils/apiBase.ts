export function getApiBaseUrl(): string {
  const fromEnv = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/+$/, '');
  }
  return '';
}

export function getWsBaseUrl(): string {
  const base = getApiBaseUrl();
  if (base.startsWith('https://')) return base.replace('https://', 'wss://');
  if (base.startsWith('http://')) return base.replace('http://', 'ws://');
  return base;
}

