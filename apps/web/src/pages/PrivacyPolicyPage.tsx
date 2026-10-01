import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { APP_NAME } from "../brand";

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL as string | undefined;
const LAST_UPDATED = "1 October 2026";

export function PrivacyPolicyPage() {
  return (
    <Page title="Privacy Policy" description={`Last updated: ${LAST_UPDATED}`}>
      <div className="card space-y-4 text-sm leading-6 text-gray-700">
        <p>
          This policy explains what {APP_NAME} collects, why, and the choices you have. {APP_NAME} is
          only for adults aged 18 and over.
        </p>

        <h2 className="text-base font-semibold">What we collect</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Account details:</b> username, email, password (stored hashed), date of birth, gender, country and language.</li>
          <li><b>Profile content:</b> photo, bio and interests you choose to add.</li>
          <li><b>Camera and microphone:</b> used only during video/voice calls, live streams and party rooms you join. Calls are streamed in real time and are not recorded by us.</li>
          <li><b>Messages and activity:</b> chat messages, gifts, call history, follows, blocks and reports.</li>
          <li><b>Payments:</b> coin, VIP and withdrawal records. Card/UPI details are handled by Google Play or our payment processor (Razorpay) and never reach our servers. When you pay with Razorpay in the Android app, we report the purchase amount to Google as required by Google Play's billing rules.</li>
          <li><b>Device and log data:</b> IP address, device ID, app version and push token, used for security, fraud prevention and notifications.</li>
        </ul>

        <h2 className="text-base font-semibold">How we use it</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>To run the service: matching, calls, chat, live rooms, wallet and payouts.</li>
          <li>To keep people safe: detecting fraud, reviewing reports and enforcing our rules.</li>
          <li>To send notifications you have allowed.</li>
        </ul>
        <p>We do not sell your personal data.</p>

        <h2 className="text-base font-semibold">Who we share it with</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Other users</b> see your public profile (username, photo, gender, country, bio).</li>
          <li><b>Service providers</b> that run parts of the app for us: hosting (Railway, Vercel), real-time video (LiveKit), payments (Google Play, Razorpay) and push notifications (Google Firebase).</li>
          <li><b>Authorities</b> when the law requires it.</li>
        </ul>

        <h2 className="text-base font-semibold">Security</h2>
        <p>Data is encrypted in transit (HTTPS/TLS) and passwords are stored hashed.</p>

        <h2 className="text-base font-semibold">Deleting your account</h2>
        <p>
          You can delete your account in the app under <i>Settings → Delete account</i>, or on the web at{" "}
          <Link to="/delete-account" className="underline">/delete-account</Link>. Your profile, photo, bio,
          preferences, favorites, notifications, devices and sessions are deleted immediately and your username
          and email are erased. Payment and transaction records are kept in anonymised form where the law
          requires us to keep financial records. Unused coins are forfeited.
        </p>

        <h2 className="text-base font-semibold">Children</h2>
        <p>{APP_NAME} is not for anyone under 18. We remove accounts we find belonging to minors.</p>

        <h2 className="text-base font-semibold">Changes</h2>
        <p>We will update the date above when this policy changes.</p>

        {SUPPORT_EMAIL && (
          <>
            <h2 className="text-base font-semibold">Contact</h2>
            <p>
              Questions or requests: <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </p>
          </>
        )}
      </div>
    </Page>
  );
}
