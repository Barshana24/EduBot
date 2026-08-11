import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2600,
          style: {
            background: 'var(--card)',
            color: 'var(--ink)',
            border: '2px solid var(--line)',
            borderRadius: 'var(--r-md)',
            fontFamily: 'Nunito, system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: 700,
            boxShadow: 'var(--shadow-float)',
          },
          success: { iconTheme: { primary: '#1FC28A', secondary: '#FFFFFF' } },
          error: { iconTheme: { primary: '#FF6257', secondary: '#FFFFFF' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)
