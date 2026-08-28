import { APP_NAME } from "../brand";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-label={`${APP_NAME} admin`}>
        <rect x="4" y="4" width="40" height="40" rx="12" fill="#4338ca" />
        <path d="M15 18c0-1.7 1.3-3 3-3h12c1.7 0 3 1.3 3 3v6c0 1.7-1.3 3-3 3H22l-5 4v-4h-0c-1.7 0-3-1.3-3-3v-6z" fill="#fff" />
        <circle cx="20" cy="21" r="1.8" fill="#a5b4fc" />
        <circle cx="24" cy="21" r="1.8" fill="#a5b4fc" />
        <circle cx="28" cy="21" r="1.8" fill="#a5b4fc" />
      </svg>
      <span className="text-base font-bold text-ink-900">{APP_NAME} Admin</span>
    </span>
  );
}
