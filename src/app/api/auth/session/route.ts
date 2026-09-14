import { NextResponse } from "next/server";
import { createSessionToken, verifySessionToken, OPERATOR_COOKIE_NAME } from "@/server/auth/session";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );

  const token = cookies[OPERATOR_COOKIE_NAME];
  const isValid = verifySessionToken(token);

  return NextResponse.json({
    authenticated: isValid,
    role: isValid ? "dispatcher" : "anonymous",
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const operatorId = body.operatorId || "dispatcher_primary";

  const token = createSessionToken(operatorId);

  const res = NextResponse.json({
    authenticated: true,
    operatorId,
    message: "Operator session established",
  });

  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set({
    name: OPERATOR_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 28800, // 8 hours
  });

  return res;
}
