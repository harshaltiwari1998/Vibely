import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { APP_NAME, APP_TAGLINE } from "../brand";
import { login } from "../store/auth";

export function LandingPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(identifier, password);
      navigate("/home");
    } catch {
      setError("Unable to sign in. Please check your credentials.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-600 to-accent-500 px-4 text-white">
      <Logo size={56} />
      <h1 className="mt-4 text-4xl font-extrabold">{APP_NAME}</h1>
      <p className="mt-2 text-lg opacity-90">{APP_TAGLINE}</p>
      <form onSubmit={onSubmit} className="mt-8 w-full max-w-sm space-y-3 rounded-2xl bg-white/10 p-6 backdrop-blur">
        <input
          className="input"
          placeholder="Email or username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-200">{error}</p>}
        <button className="btn w-full bg-white text-brand-700 hover:bg-brand-50" type="submit">
          Sign in
        </button>
        <div className="flex justify-between text-sm">
          <Link to="/register" className="underline">
            Create account
          </Link>
          <Link to="/forgot-password" className="underline">
            Forgot password?
          </Link>
        </div>
      </form>
      <button className="btn mt-4 bg-white/20 hover:bg-white/30" onClick={() => navigate("/home")}>
        Enter as guest (demo)
      </button>
    </div>
  );
}
