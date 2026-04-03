import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../hooks/useHealth";
import { Settings as SettingsIcon, LogOut, RotateCcw } from "lucide-react";

export default function Settings() {
  const { logout } = useAuth();
  const { data: health } = useHealth();
  const navigate = useNavigate();

  const defaultRepo = localStorage.getItem("cherryops_default_repo");
  const persona = localStorage.getItem("cherryops_persona");

  const handleRerunSetup = () => {
    localStorage.removeItem("cherryops_onboarded");
    localStorage.removeItem("cherryops_default_repo");
    localStorage.removeItem("cherryops_persona");
    navigate("/onboarding");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-6 h-6 text-cherry-400" />
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <div className="bg-surface-alt border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-text-muted">Server</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-muted">API Endpoint</span>
            <p className="font-mono">{window.location.origin}/api/v1</p>
          </div>
          <div>
            <span className="text-text-muted">Status</span>
            <p className={health?.status === "ok" ? "text-status-complete" : "text-status-error"}>
              {health?.status ?? "Unknown"}
            </p>
          </div>
          <div>
            <span className="text-text-muted">Uptime</span>
            <p>{health ? formatUptime(health.uptime_seconds) : "—"}</p>
          </div>
          <div>
            <span className="text-text-muted">Devices</span>
            <p>{health?.devices ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-alt border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-text-muted">About</h2>
        <div className="text-sm space-y-1">
          <p>CherryOps v0.1.0</p>
          <p className="text-text-muted">Mobile command center for AI workflows</p>
          <p className="text-text-muted">Apache 2.0 License</p>
        </div>
      </div>

      <div className="bg-surface-alt border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-text-muted">Setup</h2>
        <div className="text-sm space-y-1">
          {persona && <p><span className="text-text-muted">Persona:</span> <span className="capitalize">{persona}</span></p>}
          {defaultRepo && <p><span className="text-text-muted">Default repo:</span> <code className="bg-surface px-1 rounded text-xs">{defaultRepo}</code></p>}
        </div>
        <button
          onClick={handleRerunSetup}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface-hover transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Re-run setup
        </button>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2 px-4 py-2 bg-status-error/10 text-status-error rounded-lg text-sm hover:bg-status-error/20 transition cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
