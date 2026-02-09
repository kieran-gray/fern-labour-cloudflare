import { Route, Routes } from 'react-router-dom';
import { appRoutes } from './lib/constants';
import { BirthPlanPage } from './pages/BirthPlan/Page';
import { CompletedLabourPage } from './pages/CompletedLabour/Page';
import { ContactPage } from './pages/Contact/Page';
import { HomePage } from './pages/Home/Page';
import { LabourHistoryPage } from './pages/LabourHistory/Page';
import { NotFoundPage } from './pages/NotFound/Page';
import { SubscribePage } from './pages/Subscribe/Page';

export function Router() {
  return (
    <Routes>
      <Route path={appRoutes.home}>
        <Route index path={appRoutes.home} element={<HomePage />} />
        <Route path={appRoutes.history} element={<LabourHistoryPage />} />
        <Route path={appRoutes.birthPlanAuth} element={<BirthPlanPage authenticated />} />
        <Route path={appRoutes.notFound} element={<NotFoundPage />} />
        <Route path={appRoutes.contact} element={<ContactPage />} />
        <Route path={appRoutes.subscribe} element={<SubscribePage />} />
        <Route path={appRoutes.completed} element={<CompletedLabourPage />} />
      </Route>
    </Routes>
  );
}
