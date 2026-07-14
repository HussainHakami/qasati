import { useCallback, useEffect, useMemo } from 'react';
import { trpc } from '@/providers/trpc';

export function useOAuth() {
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      window.location.reload();
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  // Also check localStorage fallback for demo mode
  const localUser = (() => {
    try {
      const u = localStorage.getItem('qasati_currentUser');
      if (u) return JSON.parse(u);
    } catch { /* ignore */ }
    return null;
  })();

  const effectiveUser = user || localUser;

  // Clear localStorage on real OAuth login
  useEffect(() => {
    if (user) {
      try { localStorage.removeItem('qasati_currentUser'); } catch { /* ignore */ }
    }
  }, [user]);

  return useMemo(
    () => ({
      user: effectiveUser,
      isAuthenticated: !!effectiveUser,
      isLoading: isLoading || logoutMutation.isPending,
      isRealOAuth: !!user,
      error,
      logout,
      refresh: refetch,
    }),
    [effectiveUser, isLoading, logoutMutation.isPending, error, logout, refetch],
  );
}

export function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  if (!kimiAuthUrl || !appID) return null;
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set('client_id', appID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'profile');
  url.searchParams.set('state', state);

  return url.toString();
}
