import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import StatusBadge from "../components/ui/StatusBadge";
import { api, type TaskStatus, type TaskRecord } from "../lib/api";
import { ChevronDown, ChevronRight, Check, Redo2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const STATUS_OPTIONS = ["", "queued", "running", "complete", "error", "done", "discarded"];

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 20;

  const { data, refetch } = useTasks({
    status: statusFilter || undefined,
    limit,
    offset: page * limit,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-cherry-500"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface-alt border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted text-left">
              <th className="p-3 w-8" />
              <th className="p-3">ID</th>
              <th className="p-3">Repo</th>
              <th className="p-3">Status</th>
              <th className="p-3">Type</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {data?.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                expanded={expandedId === task.id}
                onToggle={() => setExpandedId(expandedId === task.id ? null : task.id)}
                onAction={() => refetch()}
              />
            ))}
            {data?.tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-muted">No tasks found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > limit && (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>Showing {page * limit + 1}–{Math.min((page + 1) * limit, data.total)} of {data.total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 bg-surface-alt border border-border rounded disabled:opacity-30 cursor-pointer"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * limit >= data.total}
              className="px-3 py-1 bg-surface-alt border border-border rounded disabled:opacity-30 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, expanded, onToggle, onAction }: {
  task: TaskRecord;
  expanded: boolean;
  onToggle: () => void;
  onAction: () => void;
}) {
  const [output, setOutput] = useState<string | null>(null);
  const [redirectBrief, setRedirectBrief] = useState("");
  const [acting, setActing] = useState(false);

  const loadOutput = async () => {
    if (!expanded && (task.status === "complete" || task.status === "done")) {
      try {
        const res = await api.taskResult(task.id);
        setOutput(res.content);
      } catch { /* ignore */ }
    }
    onToggle();
  };

  const handleApprove = async () => {
    setActing(true);
    await api.approveTask(task.id);
    setActing(false);
    onAction();
  };

  const handleRedirect = async () => {
    if (!redirectBrief.trim()) return;
    setActing(true);
    await api.redirectTask(task.id, redirectBrief);
    setActing(false);
    onAction();
  };

  const handleDiscard = async () => {
    setActing(true);
    await api.discardTask(task.id);
    setActing(false);
    onAction();
  };

  return (
    <>
      <tr
        className="border-b border-border hover:bg-surface-hover transition cursor-pointer"
        onClick={loadOutput}
      >
        <td className="p-3">
          {expanded ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
        </td>
        <td className="p-3 font-mono text-text-muted">{task.id.slice(0, 10)}</td>
        <td className="p-3">{task.repo}</td>
        <td className="p-3"><StatusBadge status={task.status as TaskStatus} /></td>
        <td className="p-3 text-text-muted">{task.type}</td>
        <td className="p-3 text-text-muted">{task.created_at.slice(0, 16).replace("T", " ")}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-border">
          <td colSpan={6} className="p-4 bg-surface">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-text-muted">Branch:</span> {task.branch}</div>
                <div><span className="text-text-muted">Agent mode:</span> {task.agent_mode}</div>
                <div><span className="text-text-muted">File path:</span> <code className="text-xs bg-surface-alt px-1 rounded">{task.task_file_path}</code></div>
                {task.output_file && <div><span className="text-text-muted">Output:</span> <code className="text-xs bg-surface-alt px-1 rounded">{task.output_file}</code></div>}
                {task.error && <div className="col-span-2 text-status-error"><span className="text-text-muted">Error:</span> {task.error}</div>}
              </div>

              {output && (
                <div className="bg-surface-alt border border-border rounded-lg p-4 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{output}</ReactMarkdown>
                </div>
              )}

              {task.status === "complete" && (
                <div className="flex items-center gap-3">
                  <button onClick={handleApprove} disabled={acting} className="flex items-center gap-1.5 px-3 py-1.5 bg-status-complete/15 text-status-complete rounded-lg text-sm hover:bg-status-complete/25 transition cursor-pointer disabled:opacity-50">
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <div className="flex items-center gap-2">
                    <input
                      value={redirectBrief}
                      onChange={(e) => setRedirectBrief(e.target.value)}
                      placeholder="Redirect instructions..."
                      className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-cherry-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button onClick={handleRedirect} disabled={acting || !redirectBrief.trim()} className="flex items-center gap-1.5 px-3 py-1.5 bg-cherry-600/15 text-cherry-400 rounded-lg text-sm hover:bg-cherry-600/25 transition cursor-pointer disabled:opacity-50">
                      <Redo2 className="w-4 h-4" /> Redirect
                    </button>
                  </div>
                  <button onClick={handleDiscard} disabled={acting} className="flex items-center gap-1.5 px-3 py-1.5 bg-status-error/15 text-status-error rounded-lg text-sm hover:bg-status-error/25 transition cursor-pointer disabled:opacity-50">
                    <Trash2 className="w-4 h-4" /> Discard
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
