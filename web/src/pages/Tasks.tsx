import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import StatusBadge from "../components/ui/StatusBadge";
import { api, type TaskStatus, type TaskRecord } from "../lib/api";
import { ChevronDown, ChevronRight, Check, Redo2, Trash2, Plus, Send, Wifi, WifiOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import DiffViewer from "../components/ui/DiffViewer";
import { useTaskStream } from "../hooks/useTaskStream";

const STATUS_OPTIONS = ["", "queued", "running", "complete", "error", "done", "discarded"];

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const limit = 20;
  const { connected } = useTaskStream();

  const { data, refetch } = useTasks({
    status: statusFilter || undefined,
    limit,
    offset: page * limit,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <span title={connected ? "Live updates active" : "Using polling"}>
            {connected ? <Wifi className="w-4 h-4 text-status-complete" /> : <WifiOff className="w-4 h-4 text-text-muted" />}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-3 py-2 bg-cherry-600 hover:bg-cherry-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
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
      </div>

      {showCreate && (
        <NewTaskForm
          onCreated={() => { setShowCreate(false); refetch(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

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
  const [diff, setDiff] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<string | null>(null);
  const [redirectBrief, setRedirectBrief] = useState("");
  const [acting, setActing] = useState(false);

  const loadOutput = async () => {
    if (!expanded && (task.status === "complete" || task.status === "done")) {
      try {
        const res = await api.taskResult(task.id);
        setOutput(res.content);
        setDiff(res.diff);
        setOutputFormat(res.output_format);
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

              {diff && <DiffViewer diff={diff} />}

              {output && !diff && (
                outputFormat === "diff" ? (
                  <DiffViewer diff={output} />
                ) : (
                  <div className="bg-surface-alt border border-border rounded-lg p-4 prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{output}</ReactMarkdown>
                  </div>
                )
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

function NewTaskForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [repo, setRepo] = useState("");
  const [brief, setBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo.trim() || !brief.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createTask({ repo: repo.trim(), brief: brief.trim() });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-alt border border-border rounded-xl p-4 space-y-4">
      <h2 className="text-sm font-medium text-text-muted">Dispatch a new ad-hoc task</h2>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs text-text-muted mb-1">Repository</label>
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/repo"
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-cherry-500"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Task brief</label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Describe what the agent should do..."
            rows={4}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-cherry-500 resize-y"
          />
        </div>
      </div>

      {error && <p className="text-sm text-status-error">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || !repo.trim() || !brief.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-cherry-600 hover:bg-cherry-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {submitting ? "Dispatching..." : "Dispatch"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface-hover transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
