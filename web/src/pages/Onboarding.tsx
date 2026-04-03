import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Hammer, Users, ArrowRight, CheckCircle, Loader2 } from "lucide-react";

type Persona = "builder" | "operator";
type Step = "persona" | "repo" | "confirm";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("persona");
  const [persona, setPersona] = useState<Persona | null>(null);
  const [repo, setRepo] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePersonaSelect = (p: Persona) => {
    setPersona(p);
    setStep("repo");
  };

  const handleVerifyRepo = async () => {
    if (!repo.trim()) return;
    setVerifying(true);
    setError(null);
    try {
      await api.fileTree(repo.trim(), "main");
      localStorage.setItem("cherryops_default_repo", repo.trim());
      localStorage.setItem("cherryops_persona", persona!);
      setStep("confirm");
    } catch {
      setError("Could not access this repository. Check that it exists and your token has read access.");
    } finally {
      setVerifying(false);
    }
  };

  const handleFinish = () => {
    localStorage.setItem("cherryops_onboarded", "true");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cherry-400">CherryOps</h1>
          <p className="text-text-muted mt-2">Let's get you set up</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {(["persona", "repo", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s ? "bg-cherry-600 text-white" :
                (["persona", "repo", "confirm"].indexOf(step) > i) ? "bg-status-complete/20 text-status-complete" :
                "bg-surface-alt text-text-muted"
              }`}>
                {(["persona", "repo", "confirm"].indexOf(step) > i) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && <div className="w-12 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Persona */}
        {step === "persona" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center">How will you use CherryOps?</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handlePersonaSelect("builder")}
                className="bg-surface-alt border border-border rounded-xl p-6 text-left hover:border-cherry-600/40 transition cursor-pointer group"
              >
                <Hammer className="w-8 h-8 text-emerald-400 mb-3" />
                <h3 className="font-medium">Builder</h3>
                <p className="text-xs text-text-muted mt-1">
                  You have an existing GitHub repo. Connect it and dispatch tasks with skills.
                </p>
              </button>
              <button
                onClick={() => handlePersonaSelect("operator")}
                className="bg-surface-alt border border-border rounded-xl p-6 text-left hover:border-cherry-600/40 transition cursor-pointer group"
              >
                <Users className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="font-medium">Operator</h3>
                <p className="text-xs text-text-muted mt-1">
                  You manage clients, content, or ops. Use AI skills for daily workflows.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Repo */}
        {step === "repo" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center">Connect your repository</h2>
            <p className="text-sm text-text-muted text-center">
              Enter a GitHub repo to use as your default project.
            </p>
            <div className="space-y-3">
              <input
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyRepo()}
                placeholder="owner/repo"
                className="w-full px-4 py-3 bg-surface-alt border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-cherry-500"
              />
              {error && <p className="text-sm text-status-error">{error}</p>}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("persona")}
                  className="px-4 py-2 bg-surface-alt border border-border rounded-lg text-sm text-text-muted hover:text-text transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyRepo}
                  disabled={!repo.trim() || verifying}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cherry-600 hover:bg-cherry-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  {verifying ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Continue</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <div className="space-y-6 text-center">
            <CheckCircle className="w-16 h-16 text-status-complete mx-auto" />
            <h2 className="text-lg font-semibold">You're all set!</h2>
            <div className="bg-surface-alt border border-border rounded-xl p-4 text-left space-y-2 text-sm">
              <div>
                <span className="text-text-muted">Persona:</span>{" "}
                <span className="capitalize">{persona}</span>
              </div>
              <div>
                <span className="text-text-muted">Repository:</span>{" "}
                <code className="bg-surface px-1.5 py-0.5 rounded text-xs">{repo}</code>
              </div>
              <div>
                <span className="text-text-muted">Skills:</span>{" "}
                {persona === "builder" ? "Builder starter pack (dev, ops)" : "Operator starter pack (client, content)"}
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="px-6 py-3 bg-cherry-600 hover:bg-cherry-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
