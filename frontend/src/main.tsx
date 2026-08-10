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
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FBF6EA',
            color: '#3A3226',
            border: '1px solid #E3D6B4',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 10px 28px -14px rgba(139,90,43,0.32)',
          },
          success: {
            iconTheme: { primary: '#8FAE7D', secondary: '#3A3226' },
          },
          error: {
            iconTheme: { primary: '#D98F72', secondary: '#3A3226' },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)
