import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import QuickCapture from "../features/QuickCapture";

export default function AppShell() {
  const { authenticated } = useAuth();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!localStorage.getItem("cherryops_onboarded")) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 ml-56 p-6">
        <Outlet />
      </main>
      <QuickCapture />
    </div>
  );
}
