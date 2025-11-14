export interface SystemConfig {
  admin_mode: boolean;
  beta_mode: boolean;
}

let configPromise: Promise<SystemConfig> | null = null;
let cachedConfig: SystemConfig | null = null;

export function getSystemConfig(): Promise<SystemConfig> {
  if (cachedConfig) {
    return Promise.resolve(cachedConfig);
  }
  if (configPromise) {
    return configPromise;
  }
  const API_BASE = import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_URL || 'https://nofx-gyc567.replit.app') + '/api';

  configPromise = fetch(`${API_BASE}/config`)
    .then((res) => res.json())
    .then((data: SystemConfig) => {
      cachedConfig = data;
      return data;
    })
    .finally(() => {
      // Keep cachedConfig for reuse; allow re-fetch via explicit invalidation if added later
    });
  return configPromise;
}


