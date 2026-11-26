import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", app: "MYP 3 Activity Hub" });
}
