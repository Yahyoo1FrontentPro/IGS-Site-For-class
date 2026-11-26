import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

function clearCookieResponse() {
  const response = NextResponse.json({ loggedOut: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function POST() {
  return clearCookieResponse();
}

export async function DELETE() {
  return clearCookieResponse();
}
