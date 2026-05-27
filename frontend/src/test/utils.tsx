import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import type { UserWithStats } from '@/types';

interface WrapperOptions {
  initialRoute?: string;
  routes?: { path: string; element: React.ReactNode }[];
  user?: UserWithStats | null;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: WrapperOptions = {}
) {
  const { initialRoute = '/', routes = [], user = null } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          {routes.length > 0 ? (
            <Routes>
              {routes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
              <Route path="*" element={children} />
            </Routes>
          ) : (
            children
          )}
        </MemoryRouter>
      </AuthProvider>
    );
  }

  const result = render(ui, { wrapper: Wrapper });

  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) =>
      result.rerender(
        <Wrapper>
          {rerenderUi}
        </Wrapper>
      ),
  };
}

export function renderWithAuth(
  ui: React.ReactElement,
  options: Omit<WrapperOptions, 'user'> & { user?: UserWithStats } = {}
) {
  return renderWithProviders(ui, { ...options, user: options.user ?? null });
}
