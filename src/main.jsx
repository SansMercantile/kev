import React from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import posthog from 'posthog-js'
import AppWebsite from './App.jsx'
import AppPlatform from './AppPlatform.jsx'
import './index.css'

const App = import.meta.env.MODE === 'platform' ? AppPlatform : AppWebsite

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    capture_pageview: true,
  })
}

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID

const root = (
  <React.StrictMode>
    {auth0Domain && auth0ClientId ? (
      <Auth0Provider
        domain={auth0Domain}
        clientId={auth0ClientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: 'https://api.kev.sansmercantile.com',
        }}
      >
        <App />
      </Auth0Provider>
    ) : (
      <App />
    )}
  </React.StrictMode>
)

ReactDOM.createRoot(document.getElementById('root')).render(root)
