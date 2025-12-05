import { useAuthStore } from "@/store/authStore";

const BASE_URL = '/api/proxy';

interface RequestConfig extends RequestInit {
    _retry?: boolean;
}

async function parseResponse<T>(res: Response): Promise<T> {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return {} as T;
    }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(csrfToken: string) {
    refreshSubscribers.forEach((cb) => cb(csrfToken));
    refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

async function fetchWithInterceptor(endpoint: string, options: RequestConfig = {}): Promise<Response> {
    const store = useAuthStore.getState();

    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    if (store.csrfToken) {
        headers.set('X-CSRF-Token', store.csrfToken);
    }

    const config: RequestConfig = {
        ...options,
        headers,
        credentials: 'include',
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (response.status === 401 && !options._retry) {
        if (isRefreshing) {
            return new Promise((resolve) => {
                addRefreshSubscriber((newToken) => {
                    headers.set('X-CSRF-Token', newToken);
                    resolve(fetch(`${BASE_URL}${endpoint}`, config));
                });
            });
        }

        options._retry = true;
        isRefreshing = true;

        try {
            const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (refreshRes.ok) {
                const data = await refreshRes.json();
                const newCsrf = data.csrf_token;
                const user = data.user;

                if (store.tenantId) {
                    store.setAuth(store.tenantId, user, newCsrf);
                }

                onRefreshed(newCsrf);

                headers.set('X-CSRF-Token', newCsrf);
                isRefreshing = false;
                return fetch(`${BASE_URL}${endpoint}`, config);
            } else {
                isRefreshing = false;
                store.logout();
                if (typeof window !== 'undefined') {
                    window.location.href = '/en/admin';
                }
                return response;
            }
        } catch {
            isRefreshing = false;
            store.logout();
            return response;
        }
    }

    return response;
}

export const api = {
    get: async <T>(url: string): Promise<T> => {
        const res = await fetchWithInterceptor(url, { method: 'GET' });
        if (!res.ok) throw new Error((await parseResponse<{error: string}>(res)).error || res.statusText);
        return parseResponse<T>(res);
    },

    post: async <T>(url: string, body: unknown): Promise<T> => {
        const res = await fetchWithInterceptor(url, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error((await parseResponse<{error: string}>(res)).error || res.statusText);
        return parseResponse<T>(res);
    },

    put: async <T>(url: string, body: unknown): Promise<T> => {
        const res = await fetchWithInterceptor(url, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error((await parseResponse<{error: string}>(res)).error || res.statusText);
        return parseResponse<T>(res);
    },

    delete: async (url: string): Promise<void> => {
        const res = await fetchWithInterceptor(url, { method: 'DELETE' });
        if (!res.ok) throw new Error((await parseResponse<{error: string}>(res)).error || res.statusText);
    }
};