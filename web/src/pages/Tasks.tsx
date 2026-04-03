import { useState, useMemo } from "react";
import { useTasks } from "../hooks/useTasks";
import { useFileContent } from "../hooks/useFileTree";
import StatusBadge from "../components/ui/StatusBadge";
import { api, type TaskStatus, type TaskRecord } from "../lib/api";
import { ChevronDown, ChevronRight, Check, Redo2, Trash2, Plus, Send, Wifi, WifiOff, ClipboardList, Bot, Circle, CheckCircle2, Code, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import DiffViewer from "../components/ui/DiffViewer";
import { useTaskStream } from "../hooks/useTaskStream";

type Tab = "project" | "agent";

const STATUS_OPTIONS = ["", "queued", "running", "complete", "error", "done", "discarded"];

export default function Tasks() {
  const [tab, setTab] = useState<Tab>("project");
  const { connected } = useTaskStream();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <span title={connected ? "Live updates active" : "Using polling"}>
            {connected ? <Wifi className="w-4 h-4 text-status-complete" /> : <WifiOff className="w-4 h-4 text-text-muted" />}
          </span>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setTab("project")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition -mb-px cursor-pointer ${
            tab === "project"
              ? "border-b-2 border-cherry-400 text-cherry-400"
              : "text-text-muted hover:text-text"
          }`}
        >
          <ClipboardList className="w-4 h-4" /> Project Tasks
        </button>
        <button
          onClick={() => setTab("agent")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition -mb-px cursor-pointer ${
            tab === "agent"
              ? "border-b-2 border-cherry-400 text-cherry-400"
              : "text-text-muted hover:text-text"
          }`}
        >
          <Bot className="w-4 h-4" /> Agent Tasks
        </button>
      </div>

      {tab === "project" ? <ProjectTasksTab /> : <AgentTasksTab />}
    </div>
  );
}

// --- Project Tasks Tab ---

interface ParsedTask {
  text: string;
  done: boolean;
  tags: string[];
  date?: string;
  note?: string;
  subtasks: ParsedTask[];
}

interface TaskSection {
  title: string;
  tasks: ParsedTask[];
}

function parseTasksMarkdown(content: string): TaskSection[] {
  const lines = content.split("\n");
  const sections: TaskSection[] = [];
  let currentSection: TaskSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Section headers (### P0, ### P1, ## Blocked, ## Completed, etc.)
    const sectionMatch = line.match(/^#{2,3}\s+(.+)/);
    if (sectionMatch) {
      currentSection = { title: sectionMatch[1]!, tasks: [] };
      sections.push(currentSection);
      continue;
    }

    // Top-level task: - [ ] or - [x]
    const taskMatch = line.match(/^- \[([ x])\] (.+)/);
    if (taskMatch && currentSection) {
      const done = taskMatch[1] === "x";
      const rawText = taskMatch[2]!;

      // Extract tags (#feature, #chore, etc.)
      const tags = [...rawText.matchAll(/#(\w+)/g)].map((m) => m[1]!);
      // Extract completion date
      const dateMatch = rawText.match(/✅\s*(\d{4}-\d{2}-\d{2})/);
      // Clean text
      const text = rawText.replace(/#\w+/g, "").replace(/✅\s*\d{4}-\d{2}-\d{2}/, "").replace(/👤\s*\w+/, "").trim();

      const task: ParsedTask = { text, done, tags, date: dateMatch?.[1], note: undefined, subtasks: [] };

      // Look ahead for notes (> lines) and subtasks (indented - [ ])
      while (i + 1 < lines.length) {
        const next = lines[i + 1]!;
        if (next.match(/^\s+>\s*(.+)/)) {
          task.note = next.replace(/^\s+>\s*/, "");
          i++;
        } else if (next.match(/^\s+- \[([ x])\] (.+)/)) {
          const subMatch = next.match(/^\s+- \[([ x])\] (.+)/)!;
          task.subtasks.push({
            text: subMatch[2]!.replace(/#\w+/g, "").trim(),
            done: subMatch[1] === "x",
            tags: [],
            subtasks: [],
          });
          i++;
        } else {
          break;
        }
      }

      currentSection.tasks.push(task);
    }
  }

  return sections;
}

const PRIORITY_COLORS: Record<string, string> = {
  "P0": "text-status-error",
  "P1": "text-status-running",
  "P2": "text-text-muted",
};

function getPriorityFromTitle(title: string): string | null {
  const match = title.match(/P(\d)/);
  return match ? `P${match[1]}` : null;
}

function ProjectTasksTab() {
  const defaultRepo = localStorage.getItem("cherryops_default_repo") ?? "";
  const [repo, setRepo] = useState(defaultRepo);
  const [activeRepo, setActiveRepo] = useState(defaultRepo);
  const { data, isLoading, error } = useFileContent(activeRepo, ".claude/tasks.md");

  const sections = useMemo(() => {
    if (!data?.content) return [];
    return parseTasksMarkdown(data.content);
  }, [data]);

  // Filter out empty sections and the notes/metadata sections
  const activeSections = sections.filter(
    (s) => s.tasks.length > 0 && !s.title.toLowerCase().includes("notes")
  );

  const handleLoadRepo = () => {
    if (repo.trim()) setActiveRepo(repo.trim());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLoadRepo()}
          placeholder="owner/repo"
          className="flex-1 max-w-sm px-3 py-2 bg-surface-alt border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-cherry-500"
        />
        <button
          onClick={handleLoadRepo}
          disabled={!repo.trim()}
          className="px-4 py-2 bg-cherry-600 hover:bg-cherry-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition cursor-pointer"
        >
          Load
        </button>
      </div>

      {isLoading && <p className="text-sm text-text-muted">Loading tasks...</p>}
      {error && <p className="text-sm text-text-muted">No .claude/tasks.md found in this repo.</p>}

      {activeSections.map((section) => {
        const priority = getPriorityFromTitle(section.title);
        return (
          <div key={section.title} className="bg-surface-alt border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              {priority && (
                <span className={`text-xs font-bold ${PRIORITY_COLORS[priority] ?? "text-text-muted"}`}>
                  {priority}
                </span>
              )}
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.tasks.map((task, i) => (
                <ProjectTaskItem key={i} task={task} />
              ))}
            </ul>
          </div>
        );
      })}

      {!isLoading && !error && activeSections.length === 0 && activeRepo && (
        <p className="text-sm text-text-muted">No tasks found.</p>
      )}
    </div>
  );
}

function ProjectTaskItem({ task }: { task: ParsedTask }) {
  return (
    <li className="space-y-1">
      <div className="flex items-start gap-2">
        {task.done ? (
          <CheckCircle2 className="w-4 h-4 text-status-complete mt-0.5 shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className={`text-sm ${task.done ? "line-through text-text-muted" : "text-text"}`}>
            {task.text}
          </span>
          {task.tags.map((tag) => (
            <span key={tag} className="ml-1.5 px-1.5 py-0.5 bg-surface-hover rounded text-xs text-text-muted">
              {tag}
            </span>
          ))}
          {task.date && (
            <span className="ml-1.5 text-xs text-text-muted">{task.date}</span>
          )}
        </div>
      </div>
      {task.note && (
        <p className="text-xs text-text-muted ml-6 italic">{task.note}</p>
      )}
      {task.subtasks.length > 0 && (
        <ul className="ml-6 space-y-1">
          {task.subtasks.map((sub, i) => (
            <li key={i} className="flex items-start gap-2">
              {sub.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-status-complete mt-0.5 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-text-muted mt-0.5 shrink-0" />
              )}
              <span className={`text-xs ${sub.done ? "line-through text-text-muted" : "text-text"}`}>
                {sub.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// --- Agent Tasks Tab ---

function AgentTasksTab() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const limit = 20;

  const { data, refetch } = useTasks({
    status: statusFilter || undefined,
    limit,
    offset: page * limit,
  });

  return (
    <div className="space-y-4">
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
  const [prUrl, setPrUrl] = useState<string | null>(null);

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
    try {
      const res = await api.approveTask(task.id);
      if (res.pr_url) setPrUrl(res.pr_url);
    } finally {
      setActing(false);
    }
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

              {prUrl && (
                <a
                  href={prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-cherry-600/15 text-cherry-400 rounded-lg text-sm hover:bg-cherry-600/25 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" /> View Pull Request
                </a>
              )}

              {task.status === "complete" && !prUrl && (
                <div className="flex items-center gap-3">
                  <button onClick={handleApprove} disabled={acting} className="flex items-center gap-1.5 px-3 py-1.5 bg-status-complete/15 text-status-complete rounded-lg text-sm hover:bg-status-complete/25 transition cursor-pointer disabled:opacity-50">
                    <Check className="w-4 h-4" /> {acting ? "Creating PR..." : "Approve & Create PR"}
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
  const [agentMode, setAgentMode] = useState<"api_direct" | "cherry_agent">("cherry_agent");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo.trim() || !brief.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createTask({ repo: repo.trim(), brief: brief.trim(), agent_mode: agentMode });
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
        <div>
          <label className="block text-xs text-text-muted mb-1">Agent mode</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAgentMode("cherry_agent")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border transition cursor-pointer ${
                agentMode === "cherry_agent"
                  ? "border-cherry-500 bg-cherry-600/15 text-cherry-400"
                  : "border-border bg-surface text-text-muted hover:text-text"
              }`}
            >
              <Bot className="w-4 h-4" /> Agent (can read/write files)
            </button>
            <button
              type="button"
              onClick={() => setAgentMode("api_direct")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border transition cursor-pointer ${
                agentMode === "api_direct"
                  ? "border-cherry-500 bg-cherry-600/15 text-cherry-400"
                  : "border-border bg-surface text-text-muted hover:text-text"
              }`}
            >
              <Code className="w-4 h-4" /> API Direct (text only)
            </button>
          </div>
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
