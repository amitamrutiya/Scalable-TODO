import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from '@/mocks/server';

// Suppress React Router Future Flag warnings in tests
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = args[0]?.toString() || '';
  if (message.includes('React Router Future Flag Warning')) return;
  originalWarn.apply(console, args);
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string): string | null {
      return store[key] || null;
    },
    setItem(key: string, value: string): void {
      store[key] = value;
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Set a stable window.location base for URL resolution
const DEFAULT_LOCATION = Object.freeze({
  href: 'http://localhost:5173/',
  origin: 'http://localhost:5173',
  protocol: 'http:',
  host: 'localhost:5173',
  hostname: 'localhost',
  port: '5173',
  pathname: '/',
  search: '',
  hash: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
});

function resetLocation() {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: {
      ...DEFAULT_LOCATION,
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
  });
}

resetLocation();

// Pin document.baseURI with a <base> element so window.location changes
// in one test don't break URL resolution for async requests in others.
const baseEl = document.createElement('base');
baseEl.href = 'http://localhost:5173/';
document.head.appendChild(baseEl);

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  cleanup();
  localStorageMock.clear();
  resetLocation();
});

afterAll(() => server.close());

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});
