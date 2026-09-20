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

export function AdminRoute({ children }: { children: ReactNode }) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));
  const isAdmin = useAuthStore((s) => s.isAdmin());
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f7f8] text-gray-900">
      <Navbar />
      <main className="mx-auto max-w-6xl px-3 py-4 pb-24 md:px-4 md:py-5 md:pb-6">{children}</main>
    </div>
  );
}
