/**
 * Vibely brand configuration.
 *
 * The product name is intentionally configurable so it can be rebranded
 * later without touching application source code. Default is "Vibely".
 */

export interface BrandConfig {
  /** Product name shown across web, admin and android. */
  name: string;
  /** Short marketing tagline. */
  tagline: string;
  /** Whether to allow the name to be overridden by environment. */
  allowEnvOverride: boolean;
}

const DEFAULT_BRAND: BrandConfig = {
  name: "Vibely",
  tagline: "Meet. Chat. Connect.",
  allowEnvOverride: true,
};

/**
 * Resolve the active brand configuration.
 * Honours APP_NAME / APP_TAGLINE environment overrides when allowed.
 */
export function resolveBrand(env: Record<string, string | undefined> = process.env): BrandConfig {
  const name = DEFAULT_BRAND.allowEnvOverride && env.APP_NAME ? env.APP_NAME : DEFAULT_BRAND.name;
  const tagline =
    DEFAULT_BRAND.allowEnvOverride && env.APP_TAGLINE ? env.APP_TAGLINE : DEFAULT_BRAND.tagline;
  return { ...DEFAULT_BRAND, name, tagline };
}

export const brand: BrandConfig = resolveBrand();

/** Build a display string such as "Vibely — Meet. Chat. Connect." */
export function brandDisplay(b: BrandConfig = brand): string {
  return `${b.name} — ${b.tagline}`;
}
