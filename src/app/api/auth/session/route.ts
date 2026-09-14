import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  verifySessionToken,
  validateRequestOrigin,
  OPERATOR_COOKIE_NAME,
} from "@/server/auth/session";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientAddress(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function consumeLoginAttempt(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  if (entry.count >= LOGIN_LIMIT) return false;
  entry.count += 1;
  return true;
}

function sameSecret(candidate: string, expected: string): boolean {
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((cookie) => {
      const [key, ...value] = cookie.trim().split("=");
      return [key, value.join("=")];
    })
  );

  try {
    const authenticated = verifySessionToken(cookies[OPERATOR_COOKIE_NAME]);
    return NextResponse.json({
      authenticated,
      role: authenticated ? "dispatcher" : "anonymous",
    });
  } catch {
    return NextResponse.json({ authenticated: false, role: "anonymous" });
  }
}

export async function POST(req: Request) {
  if (!validateRequestOrigin(req)) {
    return NextResponse.json({ error: "Origin validation failed" }, { status: 403 });
  }

  const address = clientAddress(req);
  if (!consumeLoginAttempt(address)) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again shortly." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const candidate = typeof body.operatorSecret === "string" ? body.operatorSecret : "";
  const expected = process.env.OPERATOR_SECRET;

  if (!expected || !candidate || !sameSecret(candidate, expected)) {
    return NextResponse.json({ error: "Invalid operator passphrase" }, { status: 401 });
  }

  const operatorId = "dispatcher_primary";
  const response = NextResponse.json({
    authenticated: true,
    operatorId,
    message: "Operator session established",
  });

  response.cookies.set({
    name: OPERATOR_COOKIE_NAME,
    value: createSessionToken(operatorId),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 28800,
  });

  return response;
}

export async function DELETE(req: Request) {
  if (!validateRequestOrigin(req)) {
    return NextResponse.json({ error: "Origin validation failed" }, { status: 403 });
  }

  const response = NextResponse.json({ authenticated: false });
  response.cookies.set({
    name: OPERATOR_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
