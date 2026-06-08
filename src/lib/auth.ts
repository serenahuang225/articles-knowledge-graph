import { type NextRequest } from "next/server";

export function isAuthorizedAdmin(
  request: NextRequest,
  bodySecret?: string,
): boolean {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return false;
  }

  const headerSecret = request.headers.get("x-admin-secret");
  const providedSecret = headerSecret ?? bodySecret;

  return providedSecret === adminSecret;
}
