import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { KeyRound } from "lucide-react";

export default function Login() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setError("");

    try {
      await login(token.trim());
      navigate("/");
    } catch {
      setError("Invalid admin token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cherry-600 mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-text">CherryOps</h1>
          <p className="text-text-muted mt-1">Enter your admin token to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin token"
              className="w-full px-4 py-3 bg-surface-alt border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:border-cherry-500 transition"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-status-error text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="w-full py-3 bg-cherry-600 hover:bg-cherry-700 disabled:opacity-50 text-white rounded-lg font-medium transition cursor-pointer"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>

          <p className="text-text-muted text-xs text-center">
            Find the token in your backend server logs on startup.
          </p>
        </form>
      </div>
    </div>
  );
}
