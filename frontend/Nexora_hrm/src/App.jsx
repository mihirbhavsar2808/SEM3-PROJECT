import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { C } from "./constants/theme";
import { ToastProvider } from "./context/ToastContext";
import { getCurrentStoredUser, logoutApi } from "./api/auth";

import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";

import LoginPage      from "./pages/LoginPage";
import SignupPage     from "./pages/SignupPage";
import DashboardPage  from "./pages/DashboardPage";
import EmployeesPage  from "./pages/EmployeesPage";
import AttendancePage from "./pages/AttendancePage";
import LeavePage      from "./pages/LeavePage";
import PayrollPage    from "./pages/PayrollPage";
import DepartmentsPage  from "./pages/DepartmentsPage";
import RecruitmentPage  from "./pages/RecruitmentPage";
import PerformancePage  from "./pages/PerformancePage";
import SettingsPage   from "./pages/SettingsPage";
import SubscriptionPage from "./pages/SubscriptionPage";

// User Portal Pages
import UserDashboardPage  from "./pages/UserDashboardPage";
import UserLeavePage      from "./pages/UserLeavePage";
import UserAttendancePage from "./pages/UserAttendancePage";
import UserProfilePage    from "./pages/UserProfilePage";

function useFonts() {
  useEffect(() => {
    const id = "orbit-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id   = id;
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: 20, fontFamily: "Inter, sans-serif" }}>
          <div style={{ maxWidth: 500, width: "100%", background: "#fff", padding: "32px 28px", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.06)", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, fontWeight: "bold" }}>
              !
            </div>
            <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
              Application Notice
            </h2>
            <p style={{ color: "#64748b", fontSize: 13.5, lineHeight: 1.5, margin: "0 0 20px" }}>
              {this.state.error?.message || "An error occurred while loading this view."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/dashboard";
                }}
                style={{ padding: "10px 18px", borderRadius: 8, background: "#0f172a", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5 }}
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{ padding: "10px 18px", borderRadius: 8, background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", cursor: "pointer", fontWeight: 600, fontSize: 13.5 }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authed, setAuthed] = useState(
    () => !!(localStorage.getItem("orbit_access_token") || localStorage.getItem("nexora_access_token"))
  );

  const [user, setUser] = useState(
    () => getCurrentStoredUser()
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isEmployee = user?.role === "employee";

  /*
   * Get current page from browser URL.
   * Example: /dashboard -> dashboard
   */
  const page = location.pathname.split("/")[1] || (isEmployee ? "user-dashboard" : "dashboard");

  /*
   * Navigate handler
   */
  const setPage = (newPage) => {
    navigate(`/${newPage}`);
  };

  /* LOGIN */
  const handleLogin = (userData) => {
    const u = userData || getCurrentStoredUser();
    setUser(u);
    setAuthed(true);
    if (u?.role === "employee") {
      navigate("/user-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  /* LOGOUT */
  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    setAuthed(false);
    navigate("/login");
  };

  /* NOT AUTHENTICATED */
  if (!authed) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={handleLogin}
              onNavigateSignup={() => navigate("/signup")}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <SignupPage
              onSignup={handleLogin}
              onNavigateLogin={() => navigate("/login")}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const currentUserName = user?.employee?.name || (
    user
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email
      : "User"
  );

  return (
    <div style={{ display: "flex", background: C.canvas, minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <Sidebar
        page={page}
        setPage={setPage}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        onLogout={handleLogout}
        user={user}
      />

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* TOP BAR */}
        <TopBar
          onMenu={() => setSidebarOpen((o) => !o)}
          currentUser={currentUserName}
          user={user}
          setPage={setPage}
          onLogout={handleLogout}
        />

        {/* PAGE CONTENT */}
        <div style={{ padding: 26, flex: 1 }}>
          <Routes>

            {/* USER / EMPLOYEE ROUTES */}
            <Route path="/user-dashboard"  element={<UserDashboardPage setPage={setPage} />} />
            <Route path="/user-leave"      element={<UserLeavePage />} />
            <Route path="/user-attendance" element={<UserAttendancePage />} />
            <Route path="/user-profile"    element={<UserProfilePage />} />

            {/* ADMIN ROUTES (Protected from employee access) */}
            <Route
              path="/dashboard"
              element={isEmployee ? <Navigate to="/user-dashboard" replace /> : <DashboardPage setPage={setPage} />}
            />
            <Route
              path="/employees"
              element={isEmployee ? <Navigate to="/user-dashboard" replace /> : <EmployeesPage />}
            />
            <Route
              path="/attendance"
              element={isEmployee ? <Navigate to="/user-attendance" replace /> : <AttendancePage />}
            />
            <Route
              path="/leave"
              element={isEmployee ? <Navigate to="/user-leave" replace /> : <LeavePage />}
            />
            <Route
              path="/payroll"
              element={isEmployee ? <Navigate to="/user-dashboard" replace /> : <PayrollPage />}
            />
            <Route
              path="/departments"
              element={isEmployee ? <Navigate to="/user-dashboard" replace /> : <DepartmentsPage />}
            />
            <Route
              path="/recruitment"
              element={isEmployee ? <Navigate to="/user-dashboard" replace /> : <RecruitmentPage />}
            />
            <Route
              path="/performance"
              element={isEmployee ? <Navigate to="/user-dashboard" replace /> : <PerformancePage />}
            />
            <Route
              path="/settings"
              element={<SettingsPage />}
            />
            <Route
              path="/subscription"
              element={isEmployee ? <Navigate to="/user-dashboard" replace /> : <SubscriptionPage />}
            />

            {/* UNKNOWN URL → redirect based on role */}
            <Route
              path="*"
              element={<Navigate to={isEmployee ? "/user-dashboard" : "/dashboard"} replace />}
            />

          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  useFonts();

  return (
    <BrowserRouter>
      <ToastProvider>
        <ErrorBoundary>
          <AppShell />
        </ErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  );
}