import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Navbar } from "./Navbar";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
