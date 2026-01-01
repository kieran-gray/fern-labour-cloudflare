import { Routes, Route, useLocation } from "react-router-dom";
import { useCloudflareAccess } from "@/hooks/useCloudflareAccess";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminDashboard from "./views/AdminDashboard";
import NotificationsList from "./views/NotificationsList";
import NotificationDetail from "./views/NotificationDetail";
import CommandCenter from "./views/CommandCenter";
import ContactUsMessages from "./views/ContactUsMessages";

function App() {
  const { user, isLoading, error, logout } = useCloudflareAccess();
  const location = useLocation();

  return (
    <ProtectedRoute
      user={user}
      isLoading={isLoading}
      error={error}
      logout={logout}
    >
      <div key={location.pathname} className="fade-in">
        <Routes>
          <Route
            path="/"
            element={<AdminDashboard user={user} onLogout={logout} />}
          />
          <Route
            path="/contact-us"
            element={<ContactUsMessages user={user} onLogout={logout} />}
          />
          <Route
            path="/notifications"
            element={<NotificationsList user={user} onLogout={logout} />}
          />
          <Route
            path="/notifications/:notificationId"
            element={<NotificationDetail user={user} onLogout={logout} />}
          />
          <Route
            path="/command-center"
            element={<CommandCenter user={user} onLogout={logout} />}
          />
        </Routes>
      </div>
    </ProtectedRoute>
  );
}

export default App;
