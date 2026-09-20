import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, AdminRoute, Layout } from "./components/Layout";
import { AdminLayout } from "./components/AdminLayout";
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
import { TaskCenterPage } from "./pages/TaskCenterPage";
import { InvitationPage } from "./pages/InvitationPage";
import { SearchPage } from "./pages/SearchPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { LivePage } from "./pages/LivePage";
import { GoLivePage } from "./pages/GoLivePage";
import { LiveRoomPage } from "./pages/LiveRoomPage";
import { IncomingMatchModal } from "./components/IncomingMatchModal";

function Protected({ element }: { element: JSX.Element }) {
  return (
    <ProtectedRoute>
      <Layout>{element}</Layout>
    </ProtectedRoute>
  );
}

function AdminProtected({ element }: { element: JSX.Element }) {
  return (
    <AdminRoute>
      <AdminLayout>{element}</AdminLayout>
    </AdminRoute>
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
        <Route path="/live" element={<Protected element={<LivePage />} />} />
        <Route path="/live/go-live" element={<Protected element={<GoLivePage />} />} />
        <Route path="/live/:id" element={<Protected element={<LiveRoomPage />} />} />
        <Route path="/chat" element={<Protected element={<ChatPage />} />} />
        <Route path="/profile" element={<Protected element={<ProfilePage />} />} />
        <Route path="/profile/edit" element={<Protected element={<ProfileEditPage />} />} />
        <Route path="/search" element={<Protected element={<SearchPage />} />} />
        <Route path="/wallet" element={<Protected element={<WalletPage />} />} />
        <Route path="/gifts" element={<Protected element={<GiftsPage />} />} />
        <Route path="/favorites" element={<Protected element={<FavoritesPage />} />} />
        <Route path="/history" element={<Protected element={<HistoryPage />} />} />
        <Route path="/notifications" element={<Protected element={<NotificationsPage />} />} />
        <Route path="/settings" element={<Protected element={<SettingsPage />} />} />
        <Route path="/tasks" element={<Protected element={<TaskCenterPage />} />} />
        <Route path="/invitation" element={<Protected element={<InvitationPage />} />} />

        <Route path="/admin" element={<AdminProtected element={<AdminDashboardPage />} />} />
        <Route path="/admin/users" element={<AdminProtected element={<AdminUsersPage />} />} />
        <Route path="/admin/reports" element={<AdminProtected element={<AdminReportsPage />} />} />
        <Route path="/admin/calls" element={<AdminProtected element={<AdminCallsPage />} />} />
        <Route path="/admin/messages" element={<AdminProtected element={<AdminMessagesPage />} />} />
        <Route path="/admin/transactions" element={<AdminProtected element={<AdminTransactionsPage />} />} />
        <Route path="/admin/gifts" element={<AdminProtected element={<AdminGiftsPage />} />} />
        <Route path="/admin/moderation" element={<AdminProtected element={<AdminModerationPage />} />} />
        <Route path="/admin/analytics" element={<AdminProtected element={<AdminAnalyticsPage />} />} />
        <Route path="/admin/settings" element={<AdminProtected element={<AdminSettingsPage />} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <IncomingMatchModal />
    </BrowserRouter>
  );
}
