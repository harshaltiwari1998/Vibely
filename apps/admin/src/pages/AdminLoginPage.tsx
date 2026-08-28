import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../components/Layout";
import { adminLogin } from "../store/auth";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminLogin(username, password);
      navigate("/admin");
    } catch {
      /* Part 2 */
    }
  };

  return (
    <Page title="Admin sign in">
      <form onSubmit={submit} className="card mx-auto mt-10 max-w-sm space-y-3">
        <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn-primary w-full" type="submit">Sign in</button>
      </form>
    </Page>
  );
}
