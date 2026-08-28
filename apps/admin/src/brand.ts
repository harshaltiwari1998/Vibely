import { resolveBrand } from "@vibely/config";
export const brand = resolveBrand(import.meta.env as unknown as Record<string, string | undefined>);
export const APP_NAME = brand.name;
