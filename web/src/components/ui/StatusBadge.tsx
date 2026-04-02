import type { TaskStatus } from "../../lib/api";

const statusColors: Record<TaskStatus, string> = {
  pending: "bg-status-queued/15 text-status-queued",
  queued: "bg-status-queued/15 text-status-queued",
  running: "bg-status-running/15 text-status-running",
  complete: "bg-status-complete/15 text-status-complete",
  error: "bg-status-error/15 text-status-error",
  done: "bg-status-done/15 text-status-done",
  discarded: "bg-status-discarded/15 text-status-discarded",
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[status] ?? "bg-border text-text-muted"}`}>
      {status}
    </span>
  );
}
