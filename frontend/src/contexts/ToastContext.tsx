import React from 'react';
import { Toaster, toast } from 'react-hot-toast';

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: '14px',
            padding: '12px 16px',
            borderRadius: '8px',
            maxWidth: '400px',
          },
          success: {
            style: {
              background: '#dcfce7',
              color: '#166534',
              border: '1px solid #bbf7d0',
            },
          },
          error: {
            style: {
              background: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fecaca',
            },
          },
        }}
      />
    </>
  );
}

export { toast };
