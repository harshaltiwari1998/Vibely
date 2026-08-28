import { APP_NAME } from "../brand";

/**
 * Original Vibely logo mark (no third-party assets). A stylised "speech +
 * spark" glyph rendered inline so it scales and recolours with branding.
 */
export function Logo({ size = 32, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={`${APP_NAME} logo`}>
        <defs>
          <linearGradient id="vb-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#vb-grad)" />
        <path
          d="M15 18c0-1.7 1.3-3 3-3h12c1.7 0 3 1.3 3 3v6c0 1.7-1.3 3-3 3H22l-5 4v-4h-0c-1.7 0-3-1.3-3-3v-6z"
          fill="#fff"
        />
        <circle cx="20" cy="21" r="1.8" fill="#6366f1" />
        <circle cx="24" cy="21" r="1.8" fill="#6366f1" />
        <circle cx="28" cy="21" r="1.8" fill="#6366f1" />
      </svg>
      {withWordmark && <span className="text-lg font-bold tracking-tight text-gray-900">{APP_NAME}</span>}
    </span>
  );
}
