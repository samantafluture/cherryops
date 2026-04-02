import { useHealth } from "../hooks/useHealth";
import { useTasks } from "../hooks/useTasks";
import StatusBadge from "../components/ui/StatusBadge";
import { Activity, AlertCircle, Clock, Server } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TaskStatus } from "../lib/api";

const STATUS_COLORS: Record<string, string> = {
  queued: "#42a5f5",
  running: "#ffc107",
  complete: "#4caf50",
  error: "#ef5350",
  done: "#78909c",
  discarded: "#616161",
  pending: "#42a5f5",
};

export default function Dashboard() {
  const { data: health, isLoading: healthLoading } = useHealth();
  const { data: tasksData } = useTasks({ limit: 10 });

  const taskCounts = health?.tasks ?? {};
  const chartData = Object.entries(taskCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ name: status, value: count }));

  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Server className="w-5 h-5" />}
          label="Server"
          value={healthLoading ? "..." : health?.status === "ok" ? "Healthy" : "Down"}
          color={health?.status === "ok" ? "text-status-complete" : "text-status-error"}
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Total Tasks"
          value={String(totalTasks)}
          color="text-cherry-400"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Running"
          value={String(taskCounts["running"] ?? 0)}
          color="text-status-running"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5" />}
          label="Errors"
          value={String(taskCounts["error"] ?? 0)}
          color="text-status-error"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-surface-alt border border-border rounded-xl p-6">
          <h2 className="text-sm font-medium text-text-muted mb-4">Tasks by Status</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#666"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1a1a22", border: "1px solid #2a2a36", borderRadius: "8px" }}
                  itemStyle={{ color: "#e6e1e5" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">
              No tasks yet
            </div>
          )}
          <div className="flex flex-wrap gap-3 mt-4">
            {chartData.map(({ name, value }) => (
              <div key={name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[name] }} />
                <span className="text-text-muted">{name}</span>
                <span className="text-text font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent tasks */}
        <div className="lg:col-span-2 bg-surface-alt border border-border rounded-xl p-6">
          <h2 className="text-sm font-medium text-text-muted mb-4">Recent Tasks</h2>
          {tasksData?.tasks.length ? (
            <div className="space-y-2">
              {tasksData.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-hover transition"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={task.status as TaskStatus} />
                    <span className="text-sm font-mono text-text-muted">{task.id.slice(0, 8)}</span>
                    <span className="text-sm">{task.repo}</span>
                  </div>
                  <span className="text-xs text-text-muted">{task.created_at.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No tasks dispatched yet.</p>
          )}
        </div>
      </div>

      {/* Server info */}
      {health && (
        <div className="bg-surface-alt border border-border rounded-xl p-6">
          <h2 className="text-sm font-medium text-text-muted mb-3">Server Info</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-text-muted">Uptime</span>
              <p className="font-medium">{formatUptime(health.uptime_seconds)}</p>
            </div>
            <div>
              <span className="text-text-muted">Devices</span>
              <p className="font-medium">{health.devices}</p>
            </div>
            <div>
              <span className="text-text-muted">Last Check</span>
              <p className="font-medium">{new Date(health.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-surface-alt border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 text-text-muted mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
