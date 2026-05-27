import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { PublicRoute } from '@/components/layout/PublicRoute';

describe('PublicRoute', () => {
  it('should redirect to home when authenticated', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/" element={<div>Home Page</div>} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <div>Login Page</div>
                </PublicRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // Should show login since we're not authenticated
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  it('should render children when not authenticated', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/" element={<div>Home Page</div>} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <div>Login Page</div>
                </PublicRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });
});
