import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { MatchPage } from "./pages/MatchPage";
import { CallPage } from "./pages/CallPage";
import { ChatPage } from "./pages/ChatPage";
import { ProfilePage } from "./pages/ProfilePage";
import { WalletPage } from "./pages/WalletPage";
import { GiftsPage } from "./pages/GiftsPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AdminCallsPage } from "./pages/admin/AdminCallsPage";
import { AdminMessagesPage } from "./pages/admin/AdminMessagesPage";
import { AdminTransactionsPage } from "./pages/admin/AdminTransactionsPage";
import { AdminGiftsPage } from "./pages/admin/AdminGiftsPage";
import { AdminModerationPage } from "./pages/admin/AdminModerationPage";
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";

function Protected({ element }: { element: JSX.Element }) {
  return (
    <ProtectedRoute>
      <Layout>{element}</Layout>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="/home" element={<Protected element={<HomePage />} />} />
        <Route path="/discover" element={<Protected element={<DiscoverPage />} />} />
        <Route path="/match" element={<Protected element={<MatchPage />} />} />
        <Route path="/call" element={<Protected element={<CallPage />} />} />
        <Route path="/chat" element={<Protected element={<ChatPage />} />} />
        <Route path="/profile" element={<Protected element={<ProfilePage />} />} />
        <Route path="/wallet" element={<Protected element={<WalletPage />} />} />
        <Route path="/gifts" element={<Protected element={<GiftsPage />} />} />
        <Route path="/favorites" element={<Protected element={<FavoritesPage />} />} />
        <Route path="/history" element={<Protected element={<HistoryPage />} />} />
        <Route path="/notifications" element={<Protected element={<NotificationsPage />} />} />
        <Route path="/settings" element={<Protected element={<SettingsPage />} />} />

        <Route path="/admin" element={<Protected element={<AdminDashboardPage />} />} />
        <Route path="/admin/users" element={<Protected element={<AdminUsersPage />} />} />
        <Route path="/admin/reports" element={<Protected element={<AdminReportsPage />} />} />
        <Route path="/admin/calls" element={<Protected element={<AdminCallsPage />} />} />
        <Route path="/admin/messages" element={<Protected element={<AdminMessagesPage />} />} />
        <Route path="/admin/transactions" element={<Protected element={<AdminTransactionsPage />} />} />
        <Route path="/admin/gifts" element={<Protected element={<AdminGiftsPage />} />} />
        <Route path="/admin/moderation" element={<Protected element={<AdminModerationPage />} />} />
        <Route path="/admin/analytics" element={<Protected element={<AdminAnalyticsPage />} />} />
        <Route path="/admin/settings" element={<Protected element={<AdminSettingsPage />} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
