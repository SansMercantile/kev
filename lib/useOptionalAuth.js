import { useAuth0 } from '@auth0/auth0-react'

// useAuth0 throws when no Auth0Provider is mounted (e.g. local dev without
// env keys). Public pages use this so they render either way.
export function useOptionalAuth() {
  try {
    return useAuth0()
  } catch {
    return {
      isAuthenticated: false,
      isLoading: false,
      loginWithRedirect: undefined,
      getAccessTokenSilently: undefined,
    }
  }
}
