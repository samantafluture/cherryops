import { useState } from "react";
import { api, type SkillDefinition, type SkillCategory } from "../lib/api";
import { useSkills } from "../hooks/useSkills";
import { CheckCircle, XCircle, AlertTriangle, Sparkles, Code, Cpu, Play, Send } from "lucide-react";

type Tab = "browse" | "validate";

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  client: "Client",
  content: "Content",
  dev: "Dev",
  ops: "Ops",
  finance: "Finance",
  custom: "Custom",
};

const CATEGORY_COLORS: Record<SkillCategory, string> = {
  client: "bg-blue-500/15 text-blue-400",
  content: "bg-purple-500/15 text-purple-400",
  dev: "bg-emerald-500/15 text-emerald-400",
  ops: "bg-amber-500/15 text-amber-400",
  finance: "bg-rose-500/15 text-rose-400",
  custom: "bg-gray-500/15 text-gray-400",
};

export default function Skills() {
  const [tab, setTab] = useState<Tab>("browse");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-cherry-400" />
        <h1 className="text-2xl font-semibold">Skills</h1>
      </div>

      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setTab("browse")}
          className={`px-4 py-2 text-sm font-medium transition -mb-px cursor-pointer ${
            tab === "browse"
              ? "border-b-2 border-cherry-400 text-cherry-400"
              : "text-text-muted hover:text-text"
          }`}
        >
          Browse
        </button>
        <button
          onClick={() => setTab("validate")}
          className={`px-4 py-2 text-sm font-medium transition -mb-px cursor-pointer ${
            tab === "validate"
              ? "border-b-2 border-cherry-400 text-cherry-400"
              : "text-text-muted hover:text-text"
          }`}
        >
          Validate
        </button>
      </div>

      {tab === "browse" ? <BrowseTab /> : <ValidateTab />}
    </div>
  );
}

function BrowseTab() {
  const { data, isLoading } = useSkills();
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const skills = data?.skills ?? [];
  const filtered = categoryFilter
    ? skills.filter((s) => s.category === categoryFilter)
    : skills;

  const categories = [...new Set(skills.map((s) => s.category))].sort();

  if (isLoading) {
    return <p className="text-text-muted text-sm">Loading skills...</p>;
  }

  if (skills.length === 0) {
    return <p className="text-text-muted text-sm">No skills found. Add YAML files to the skills/ directory.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-cherry-500"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c as SkillCategory] ?? c}</option>
          ))}
        </select>
        <span className="text-sm text-text-muted">{filtered.length} skill{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  );
}

function SkillCard({ skill }: { skill: SkillDefinition }) {
  const [expanded, setExpanded] = useState(false);
  const [showRun, setShowRun] = useState(false);
  const [repo, setRepo] = useState(() => localStorage.getItem("cherryops_default_repo") ?? "");
  const [vars, setVars] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setVar = (id: string, value: string) => setVars((prev) => ({ ...prev, [id]: value }));

  const buildBrief = () => {
    let brief = skill.prompt_template;
    for (const v of skill.variables) {
      brief = brief.replaceAll(`{{${v.id}}}`, vars[v.id] ?? "");
    }
    return brief;
  };

  const canSubmit = repo.trim() && skill.variables.filter((v) => v.required).every((v) => vars[v.id]?.trim());

  const handleRun = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createTask({ repo: repo.trim(), brief: buildBrief(), skill_id: skill.id });
      setDispatched(true);
      setTimeout(() => { setDispatched(false); setShowRun(false); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dispatch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-alt border border-border rounded-xl p-4 hover:border-cherry-600/40 transition">
      <div
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{skill.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{skill.name}</h3>
            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{skill.description}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowRun(!showRun); }}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-cherry-600/15 text-cherry-400 rounded-lg text-xs font-medium hover:bg-cherry-600/25 transition cursor-pointer"
          >
            <Play className="w-3 h-3" /> Run
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[skill.category]}`}>
            {CATEGORY_LABELS[skill.category]}
          </span>
          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-surface-hover text-text-muted">
            {skill.persona}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-text-muted bg-surface-hover">
            {skill.agent_mode === "cherry_agent" ? <Cpu className="w-3 h-3" /> : <Code className="w-3 h-3" />}
            {skill.agent_mode === "cherry_agent" ? "Agent" : "API"}
          </span>
          {skill.variables.length > 0 && (
            <span className="text-xs text-text-muted">
              {skill.variables.length} var{skill.variables.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-3 border-t border-border space-y-2 text-xs">
          <div className="text-text-muted">
            <span className="font-medium text-text">Author:</span> {skill.author}
          </div>
          <div className="text-text-muted">
            <span className="font-medium text-text">Version:</span> {skill.version}
          </div>
          {skill.context_files?.length > 0 && (
            <div className="text-text-muted">
              <span className="font-medium text-text">Context:</span>{" "}
              {skill.context_files.map((f) => (
                <code key={f} className="bg-surface px-1 rounded mr-1">{f}</code>
              ))}
            </div>
          )}
          {skill.tags?.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {skill.tags.map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 bg-surface rounded text-text-muted">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {showRun && (
        <div className="mt-4 pt-3 border-t border-border space-y-3" onClick={(e) => e.stopPropagation()}>
          <div>
            <label className="block text-xs text-text-muted mb-1">Repository</label>
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="owner/repo"
              className="w-full px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-cherry-500"
            />
          </div>

          {skill.variables.map((v) => (
            <div key={v.id}>
              <label className="block text-xs text-text-muted mb-1">
                {v.label}{v.required && <span className="text-cherry-400"> *</span>}
              </label>
              {v.type === "select" && v.options ? (
                <select
                  value={vars[v.id] ?? ""}
                  onChange={(e) => setVar(v.id, e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-cherry-500"
                >
                  <option value="">Select...</option>
                  {v.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={vars[v.id] ?? ""}
                  onChange={(e) => setVar(v.id, e.target.value)}
                  placeholder={v.placeholder}
                  className="w-full px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-cherry-500"
                />
              )}
            </div>
          ))}

          {error && <p className="text-xs text-status-error">{error}</p>}

          <button
            onClick={handleRun}
            disabled={submitting || !canSubmit || dispatched}
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
      )}
    </div>
  );
}

function ValidateTab() {
  const [yaml, setYaml] = useState("");
  const [result, setResult] = useState<{ valid: boolean; skill_id?: string; errors?: string[]; warnings?: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = async () => {
    if (!yaml.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.validateSkill(yaml);
      setResult(res);
    } catch (err) {
      setResult({ valid: false, errors: [String(err)] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-text-muted text-sm">
        Paste a skill YAML definition to validate it against the CherryOps schema v1.
      </p>

      <div className="bg-surface-alt border border-border rounded-xl p-4">
        <textarea
          value={yaml}
          onChange={(e) => setYaml(e.target.value)}
          placeholder={`schema_version: "1"\nid: my-skill\nname: My Skill\n...`}
          className="w-full h-64 bg-surface border border-border rounded-lg p-3 text-sm font-mono text-text placeholder:text-text-muted focus:outline-none focus:border-cherry-500 resize-y"
        />

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={validate}
            disabled={loading || !yaml.trim()}
            className="px-4 py-2 bg-cherry-600 hover:bg-cherry-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition cursor-pointer"
          >
            {loading ? "Validating..." : "Validate"}
          </button>

          <label className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface-hover transition cursor-pointer">
            Upload YAML
            <input
              type="file"
              accept=".yaml,.yml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setYaml(reader.result as string);
                  reader.readAsText(file);
                }
              }}
            />
          </label>
        </div>
      </div>

      {result && (
        <div className={`border rounded-xl p-4 ${result.valid ? "bg-status-complete/5 border-status-complete/30" : "bg-status-error/5 border-status-error/30"}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.valid ? (
              <>
                <CheckCircle className="w-5 h-5 text-status-complete" />
                <span className="font-medium text-status-complete">Valid</span>
                {result.skill_id && <span className="text-text-muted text-sm">— {result.skill_id}</span>}
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-status-error" />
                <span className="font-medium text-status-error">Invalid</span>
              </>
            )}
          </div>

          {result.errors && result.errors.length > 0 && (
            <ul className="space-y-1 text-sm text-status-error">
              {result.errors.map((err, i) => (
                <li key={i} className="flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {err}
                </li>
              ))}
            </ul>
          )}

          {result.warnings && result.warnings.length > 0 && (
            <ul className="space-y-1 text-sm text-status-running mt-2">
              {result.warnings.map((warn, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {warn}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
