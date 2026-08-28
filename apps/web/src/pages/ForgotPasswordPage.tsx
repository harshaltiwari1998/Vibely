import { useState } from "react";
import { Link } from "react-router-dom";
import { Page, Placeholder } from "../components/Page";
import api from "../lib/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/auth/forgot-password", { email }).catch(() => undefined);
    setSent(true);
  };

  return (
    <Page title="Reset your password">
      {sent ? (
        <div className="card">If the account exists, a reset link has been sent to {email}.</div>
      ) : (
        <form onSubmit={submit} className="card space-y-3">
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn-primary w-full" type="submit">Send reset link</button>
          <Link to="/login" className="block text-center text-sm text-gray-500 underline">Back to sign in</Link>
        </form>
      )}
      <Placeholder note="Wired to POST /api/auth/forgot-password; email delivery in Part 2." />
    </Page>
  );
}
