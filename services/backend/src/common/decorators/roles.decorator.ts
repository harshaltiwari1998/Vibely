import { SetMetadata } from "@nestjs/common";
import { Role } from "../constants/roles";

export const ROLES_KEY = "roles";

/** Restrict a route to the given roles. Used with RolesGuard. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
