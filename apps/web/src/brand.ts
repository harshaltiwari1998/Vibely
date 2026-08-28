import { resolveBrand } from "@vibely/config";

/**
 * Resolves the active product brand. The name is configurable via the
 * APP_NAME environment variable (see packages/config), so rebranding does not
 * require changing application source.
 */
export const brand = resolveBrand(import.meta.env as unknown as Record<string, string | undefined>);
export const APP_NAME = brand.name;
export const APP_TAGLINE = brand.tagline;
