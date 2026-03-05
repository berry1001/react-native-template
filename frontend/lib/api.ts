/**
 * API Configuration
 *
 * The backend URL is automatically configured:
 * - Cloudflare sandbox: Derived from current hostname (8081→3002 port swap)
 * - Local development: Read from EXPO_PUBLIC_BACKEND_URL or fallback to localhost
 * - Production: Use your deployed API URL
 */

function resolveBackendUrl(): string {
  // Explicit env var takes priority
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }

  // In browser: detect CF sandbox preview URL and derive backend URL
  // Preview format: https://{port}-{sandboxId}-{token}.{domain}
  // Token = p{port}{idPart} (16 chars). We swap port and recompute token.
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    const dotIdx = host.indexOf('.');
    if (dotIdx === -1) return 'http://localhost:3002';
    const subdomain = host.slice(0, dotIdx);
    const domain = host.slice(dotIdx + 1);
    // subdomain: {port}-{sandboxId}-{token}
    // token always starts with p{port}, e.g. p8081projectf99e
    const firstDash = subdomain.indexOf('-');
    if (firstDash === -1) return 'http://localhost:3002';
    const lastDash = subdomain.lastIndexOf('-');
    if (lastDash === firstDash) return 'http://localhost:3002';
    const sandboxId = subdomain.slice(firstDash + 1, lastDash);
    const token = subdomain.slice(lastDash + 1);
    // Extract idPart: token without the p{port} prefix
    const idPart = token.replace(/^p\d+/, '');
    const newToken = `p3002${idPart}`;
    return `https://3002-${sandboxId}-${newToken}.${domain}`;
  }

  return 'http://localhost:3002';
}

const BACKEND_URL = resolveBackendUrl();

/**
 * Simple fetch wrapper for API calls
 */
export async function apiRequest<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Example usage:
 *
 * import { apiRequest } from '@/lib/api';
 *
 * const data = await apiRequest('/users');
 */

export { BACKEND_URL };
