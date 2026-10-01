import { useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { APP_NAME } from "../brand";
import api from "../lib/api";

// Public page required by Google Play: lets people delete their account
// without installing the app. Signs in with the given credentials just to
// authorize the delete call; nothing is stored in the browser.
export function DeleteAccountPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login", { identifier, password });
      const accessToken: string = (data.data ?? data).accessToken;
      await api.post("/users/me/delete", { password }, { headers: { Authorization: `Bearer ${accessToken}` } });
      setDone(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(status === 401 ? "Incorrect username/email or password." : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title={`Delete your ${APP_NAME} account`}>
      {done ? (
        <div className="card">Your account has been deleted.</div>
      ) : (
        <form onSubmit={submit} className="card space-y-3">
          <p className="text-sm text-gray-600">
            This permanently deletes your profile, photo, bio, preferences and sessions, and erases your
            username and email. Unused coins are forfeited. Payment records are kept in anonymised form as
            required by law. See the <Link to="/privacy" className="underline">privacy policy</Link>.
          </p>
          <input className="input" placeholder="Email or username" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <input className="input" type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            I understand this cannot be undone.
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" type="submit" disabled={busy || !confirmed || !identifier || !password}>
            {busy ? "Deleting…" : "Delete my account"}
          </button>
        </form>
      )}
    </Page>
  );
}
