export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@base/(.*)$': '<rootDir>/src/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@clients/(.*)$': '<rootDir>/src/clients/$1',
    '^@home/(.*)$': '<rootDir>/src/pages/Home/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.spec.{ts,tsx}'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  globals: {
    'import.meta': {
      env: {
        VITE_CONTACT_SERVICE_URL: 'http://localhost:3000',
        VITE_API_URL: 'http://localhost:3000',
        VITE_LABOUR_SERVICE_URL: 'http://localhost:3001',
      }
    }
  },
};