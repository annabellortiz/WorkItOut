import { getValidIdToken } from './auth';

export type ApiClient = {
  baseUrl?: string;
  request: <T = any>(path: string, options?: RequestInit & { json?: any }) => Promise<T>;
};

export function createApiClient(baseUrl = ''): ApiClient {
  async function request<T = any>(path: string, options: RequestInit & { json?: any } = {}) {
    const url = path.startsWith('http') ? path : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

    const token = await getValidIdToken();

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let body: BodyInit | undefined = options.body as BodyInit | undefined;

    if (options.json !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.json);
    }

    const res = await fetch(url, { ...options, headers, body });

    const contentType = res.headers.get('content-type') || '';
    if (res.status === 204) return null as any;

    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data?.message || `Request failed: ${res.status}`);
      return data as T;
    }

    const text = await res.text();
    if (!res.ok) throw new Error(text || `Request failed: ${res.status}`);
    return text as unknown as T;
  }

  return { baseUrl, request };
}

// Default client (empty baseUrl) — prefer creating a client with your API base URL
export const apiClient = createApiClient('');
