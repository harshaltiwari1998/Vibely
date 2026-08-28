import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { login } from "../store/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.identifier, form.password);
      navigate("/home");
    } catch {
      setError("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Sign in">
      <form onSubmit={submit} className="card space-y-3">
        <input className="input" placeholder="Email or username" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} />
        <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
        <div className="flex justify-between text-sm text-gray-500">
          <Link to="/register" className="underline">Create account</Link>
          <Link to="/forgot-password" className="underline">Forgot password?</Link>
        </div>
      </form>
    </Page>
  );
}
