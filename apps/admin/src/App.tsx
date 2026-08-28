import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, AdminLayout } from "./components/Layout";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import {
  AdminUsersPage,
  AdminReportsPage,
  AdminCallsPage,
  AdminGiftsPage,
  AdminTransactionsPage,
  AdminSettingsPage,
} from "./pages/AdminPages";

function Admin({ element }: { element: JSX.Element }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{element}</AdminLayout>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<Admin element={<AdminDashboardPage />} />} />
        <Route path="/admin/users" element={<Admin element={<AdminUsersPage />} />} />
        <Route path="/admin/reports" element={<Admin element={<AdminReportsPage />} />} />
        <Route path="/admin/calls" element={<Admin element={<AdminCallsPage />} />} />
        <Route path="/admin/gifts" element={<Admin element={<AdminGiftsPage />} />} />
        <Route path="/admin/transactions" element={<Admin element={<AdminTransactionsPage />} />} />
        <Route path="/admin/settings" element={<Admin element={<AdminSettingsPage />} />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
