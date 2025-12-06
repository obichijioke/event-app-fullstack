import { API_BASE_URL } from './config';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type RequestConfig = RequestInit & {
  token?: string;
};

export class ApiClient {
  constructor(private readonly baseUrl: string = API_BASE_URL) {}

  private createUrl(path: string) {
    return new URL(path, this.baseUrl).toString();
  }

  private buildHeaders(existing: HeadersInit | undefined, token?: string, skipJsonContentType = false) {
    const headers = new Headers(existing ?? {});

    if (!skipJsonContentType && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  async request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const { token, ...rest } = config;
    const isFormData = rest.body instanceof FormData;
    const response = await fetch(this.createUrl(path), {
      credentials: 'include',
      ...rest,
      headers: this.buildHeaders(rest.headers, token, isFormData),
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const body = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        (isJson && body?.message) || body || `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, body);
    }

    return body as T;
  }

  get<T>(path: string, token?: string) {
    return this.request<T>(path, {
      method: 'GET',
      token,
    });
  }

  post<T>(path: string, data?: unknown, token?: string) {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      token,
    });
  }

  postFormData<T>(path: string, data: FormData, token?: string) {
    return this.request<T>(path, {
      method: 'POST',
      body: data,
      token,
    });
  }

  patch<T>(path: string, data?: unknown, token?: string) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      token,
    });
  }

  delete<T>(path: string, token?: string) {
    return this.request<T>(path, {
      method: 'DELETE',
      token,
    });
  }
}

export const apiClient = new ApiClient();
