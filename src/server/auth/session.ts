import crypto from "crypto";

const SECRET = process.env.OPERATOR_SECRET || "dwellguard_development_operator_secret_key_32_bytes";
export const OPERATOR_COOKIE_NAME = "dwellguard_op_session";

/**
 * Creates a signed session token: "<data>.<signature>"
 */
export function createSessionToken(operatorId = "dispatcher_primary"): string {
  const payload = JSON.stringify({
    sub: operatorId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a signed session token
 */
export function verifySessionToken(token?: string | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(encodedPayload)
    .digest("base64url");

  // Constant-time comparison
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Origin and CSRF validation
 */
export function validateRequestOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return true; // Non-browser / same-site
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}
