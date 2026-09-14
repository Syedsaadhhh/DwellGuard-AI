import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    database:
      Boolean(process.env.SUPABASE_URL) &&
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    calls: Boolean(process.env.CALLE_API_KEY),
    operator: Boolean(process.env.OPERATOR_SECRET),
    publicUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
  };

  return NextResponse.json(
    {
      service: "dwellguard",
      status: Object.values(checks).every(Boolean) ? "configured" : "setup_required",
      checks,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    }
  );
}
