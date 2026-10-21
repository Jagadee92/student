import { useEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import SiteLayout from "./layouts/SiteLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Privacy from "./pages/Privacy.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Students from "./pages/Students.jsx";
import UsersPage from "./pages/Users.jsx";
import Courses from "./pages/Courses.jsx";
import Instructors from "./pages/Instructors.jsx";
import Programs from "./pages/Programs.jsx";
import Profile from "./pages/Profile.jsx";
import Forbidden from "./pages/Forbidden.jsx";
import NotFound from "./pages/NotFound.jsx";
import { getLoginPath } from "./utils/loginPath.js";

function SignedInRedirect() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return <Navigate to={getLoginPath(user.role)} replace />;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const handledInitialNavigation = useRef(false);

  useEffect(() => {
    if (handledInitialNavigation.current) return;
    handledInitialNavigation.current = true;

    const navigation = window.performance.getEntriesByType("navigation")[0];
    if (navigation?.type === "reload" && location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="login" element={<SignedInRedirect />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="forbidden" element={<Forbidden />} />

        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<Profile />} />
          <Route path="courses" element={<Courses />} />
          <Route path="instructors" element={<Instructors />} />

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="students" element={<Students />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="programs" element={<Programs />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
