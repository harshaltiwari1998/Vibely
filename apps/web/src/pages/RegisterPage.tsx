import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { register } from "../store/auth";
import { Gender } from "@vibely/types";

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "", email: "", password: "", dateOfBirth: "", gender: Gender.Male, country: "", language: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const age = new Date().getFullYear() - new Date(form.dateOfBirth).getFullYear();
    if (age < 18) {
      setError("You must be at least 18 years old.");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Create your account">
      <form onSubmit={submit} className="card space-y-3">
        <input className="input" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input className="input" type="date" placeholder="Date of birth" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
        <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as typeof form.gender })}>
          <option value={Gender.Male}>Male</option>
          <option value={Gender.Female}>Female</option>
          <option value={Gender.NonBinary}>Non-binary</option>
          <option value={Gender.Other}>Other</option>
          <option value={Gender.PreferNotToSay}>Prefer not to say</option>
        </select>
        <input className="input" placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        <input className="input" placeholder="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
        <Link to="/login" className="block text-center text-sm text-gray-500 underline">Already have an account?</Link>
      </form>
    </Page>
  );
}
