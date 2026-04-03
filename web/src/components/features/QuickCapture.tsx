import { useState, useRef, useEffect } from "react";
import { api } from "../../lib/api";
import { Zap, Send, X, CheckCircle } from "lucide-react";

export default function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const defaultRepo = localStorage.getItem("cherryops_default_repo");

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Keyboard shortcut: Ctrl+K to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleSubmit = async () => {
    if (!brief.trim() || !defaultRepo) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createTask({ repo: defaultRepo, brief: brief.trim() });
      setBrief("");
      setDispatched(true);
      setTimeout(() => { setDispatched(false); setOpen(false); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dispatch");
    } finally {
      setSubmitting(false);
    }
  };

  if (!defaultRepo) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Quick capture (Ctrl+K)"
          className="fixed bottom-6 right-6 w-12 h-12 bg-cherry-600 hover:bg-cherry-700 text-white rounded-full shadow-lg flex items-center justify-center transition cursor-pointer z-50"
        >
          <Zap className="w-5 h-5" />
        </button>
      )}

      {/* Capture panel */}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 bg-surface-alt border border-border rounded-xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-cherry-400" />
              <span className="font-medium">Quick Capture</span>
              <span className="text-xs text-text-muted">{defaultRepo}</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-text-muted hover:text-text transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <textarea
              ref={inputRef}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="What should the agent do?"
              rows={3}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-cherry-500 resize-none"
            />

            {error && <p className="text-xs text-status-error">{error}</p>}

            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Ctrl+Enter to dispatch</span>
              <button
                onClick={handleSubmit}
                disabled={submitting || !brief.trim() || dispatched}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cherry-600 hover:bg-cherry-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition cursor-pointer"
              >
                {dispatched ? (
                  <><CheckCircle className="w-3.5 h-3.5" /> Dispatched!</>
                ) : submitting ? (
                  "Dispatching..."
                ) : (
                  <><Send className="w-3.5 h-3.5" /> Dispatch</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
