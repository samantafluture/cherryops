import { useState } from "react";
import { api } from "../lib/api";
import { CheckCircle, XCircle, AlertTriangle, Sparkles } from "lucide-react";

export default function Skills() {
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-cherry-400" />
        <h1 className="text-2xl font-semibold">Skill Validator</h1>
      </div>

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

          {/* File upload */}
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
