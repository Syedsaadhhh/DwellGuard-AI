import crypto from "crypto";

export const OPERATOR_COOKIE_NAME = "dwellguard_op_session";

function getSecret(): string {
  const secret = process.env.OPERATOR_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SECURITY FAULT: OPERATOR_SECRET must be defined in production environment.");
    }
    return "dwellguard_development_only_secret_key_32_bytes_min";
  }
  return secret;
}

/**
 * Creates a signed session token: "<encodedPayload>.<signature>"
 */
export function createSessionToken(operatorId = "dispatcher_primary"): string {
  const secret = getSecret();
  const payload = JSON.stringify({
    sub: operatorId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 28800, // 8-hour short-lived operator session
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
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
  const secret = getSecret();
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return false;
    }
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
  if (!origin || !host) return true; // Non-browser / same-site request
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

/**
 * Server-side operator authentication check.
 * Verifies origin/CSRF and short-lived signed cookie.
 */
export function checkOperatorAuth(req: Request): { authorized: boolean; reason?: string } {
  if (!validateRequestOrigin(req)) {
    return { authorized: false, reason: "CSRF_ORIGIN_MISMATCH" };
  }

  // Allow bypass in unit test harness if explicitly requested
  if (process.env.NODE_ENV === "test" && req.headers.get("x-dwellguard-test") === "true") {
    return { authorized: true };
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );

  const sessionToken = cookies[OPERATOR_COOKIE_NAME];
  if (!sessionToken || !verifySessionToken(sessionToken)) {
    return { authorized: false, reason: "UNAUTHORIZED_OPERATOR" };
  }

  return { authorized: true };
}
