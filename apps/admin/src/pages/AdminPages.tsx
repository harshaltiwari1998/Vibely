import { Page } from "../components/Layout";
import { Placeholder } from "../components/Placeholder";

export function AdminUsersPage() {
  return (
    <Page title="Users">
      <div className="card text-sm text-slate-500">User management table (search, suspend, ban) — Part 2.</div>
      <Placeholder note="GET /api/admin/users" />
    </Page>
  );
}

export function AdminReportsPage() {
  return (
    <Page title="Reports">
      <div className="card text-sm text-slate-500">Reported content queue and resolution actions — Part 2.</div>
      <Placeholder note="GET /api/admin/reports" />
    </Page>
  );
}

export function AdminCallsPage() {
  return (
    <Page title="Calls">
      <div className="card text-sm text-slate-500">Call logs and moderator review — Part 2.</div>
      <Placeholder note="GET /api/admin/calls" />
    </Page>
  );
}

export function AdminGiftsPage() {
  return (
    <Page title="Gifts">
      <div className="card text-sm text-slate-500">Gift catalogue management — Part 2.</div>
      <Placeholder note="GET /api/admin/gifts" />
    </Page>
  );
}

export function AdminTransactionsPage() {
  return (
    <Page title="Transactions">
      <div className="card text-sm text-slate-500">Coin & payment transaction ledger — Part 2.</div>
      <Placeholder note="GET /api/admin/transactions" />
    </Page>
  );
}

export function AdminSettingsPage() {
  return (
    <Page title="Settings">
      <div className="card text-sm text-slate-500">Platform configuration (moderation thresholds, branding) — Part 2.</div>
      <Placeholder note="GET /api/admin/settings" />
    </Page>
  );
}
