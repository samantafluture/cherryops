import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ListTodo,
  Sparkles,
  FolderOpen,
  Smartphone,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Overview" },
  { to: "/tasks", icon: ListTodo, label: "Tasks" },
  { to: "/skills", icon: Sparkles, label: "Skills" },
  { to: "/files", icon: FolderOpen, label: "Files" },
  { to: "/devices", icon: Smartphone, label: "Devices" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-56 h-screen bg-surface-alt border-r border-border flex flex-col fixed left-0 top-0">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold text-cherry-400">CherryOps</h1>
        <p className="text-xs text-text-muted">Command Center</p>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? "bg-cherry-600/15 text-cherry-400"
                  : "text-text-muted hover:text-text hover:bg-surface-hover"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-status-error hover:bg-surface-hover transition w-full cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
