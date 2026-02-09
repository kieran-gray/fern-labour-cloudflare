import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import './styles.css';

import { StrictMode } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClientProvider } from '@tanstack/react-query';
import reactDom from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import App from './App';
import { ProtectedApp } from './components/ProtectedApp';
import { PWAUpdateHandler } from './components/PWAUpdateHandler';
import { queryClient } from './config/index';
import { appRoutes } from './lib/constants';
import { initializeQueryPersistence } from './offline/persistence/queryPersistence';
import { BirthPlanPage } from './pages/BirthPlan/Page';
import { OnboardingPage } from './pages/Onboarding/OnboardingPage';
import { theme } from './theme';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

async function initializeOfflineInfrastructure() {
  try {
    await initializeQueryPersistence(queryClient);
  } catch (error) {
    // Continue without offline features
  }
}

initializeOfflineInfrastructure();

// biome-ignore lint/style/noNonNullAssertion: We expect this element to always exist
reactDom.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-center" mt={60} zIndex={199} />
      <BrowserRouter basename="/">
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path={appRoutes.onboarding} element={<OnboardingPage />} />
              <Route path={appRoutes.birthPlan} element={<BirthPlanPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedApp>
                    <PWAUpdateHandler />
                    <App />
                  </ProtectedApp>
                }
              />
            </Routes>
          </QueryClientProvider>
        </ClerkProvider>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
);
