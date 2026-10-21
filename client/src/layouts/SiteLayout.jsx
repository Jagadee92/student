import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function SiteLayout() {
  const { pathname } = useLocation();
  const section = pathname.split("/")[1] || "home";
  const animatedSections = new Set([
    "dashboard",
    "students",
    "users",
    "courses",
    "instructors",
    "programs",
    "profile",
  ]);
  const pageTransition = animatedSections.has(section) ? section : "default";

  return (
    <div className="site-shell">
      <Navbar />
      <main
        key={pathname}
        className={`site-main page-transition page-transition-${pageTransition}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
