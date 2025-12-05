import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserProfile {
    id: string;
    username: string;
    role: string;
}

interface AuthState {
    tenantId: string | null;
    tenantName?: string;
    tenantLogo?: string;
    user: UserProfile | null;
    csrfToken: string | null;
    isAuthenticated: boolean;
    _hasHydrated: boolean;

    setAuth: (tenantId: string, user: UserProfile, csrfToken: string, tenantName?: string, tenantLogo?: string) => void;
    setCsrfToken: (token: string) => void;
    setTenantInfo: (name: string, logoUrl?: string) => void;
    logout: () => void;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            tenantId: null,
            user: null,
            csrfToken: null,
            isAuthenticated: false,
            _hasHydrated: false,

            setAuth: (tenantId, user, csrfToken, tenantName, tenantLogo) => {
                set({ tenantId, user, csrfToken, isAuthenticated: true, tenantName, tenantLogo });
            },

            setCsrfToken: (csrfToken) => {
                set({ csrfToken });
            },

            setTenantInfo: (name, logoUrl) => {
                set({ tenantName: name, tenantLogo: logoUrl });
            },

            logout: () => {
                set({ tenantId: null, user: null, csrfToken: null, isAuthenticated: false, tenantName: undefined, tenantLogo: undefined });
            },

            setHasHydrated: (state) => {
                set({ _hasHydrated: state });
            }
        }),
        {
            name: 'booking_auth_storage',
            storage: createJSONStorage(() => localStorage),
            skipHydration: true,
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);