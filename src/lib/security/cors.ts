import { NextResponse } from "next/server";

const productionOrigin = process.env.PRODUCTION_FRONTEND_ORIGIN;

export function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  if (!productionOrigin) return origin.includes("localhost");
  return origin === productionOrigin;
}

export function applyCorsHeaders(response: NextResponse, origin: string | null) {
  if (isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin!);
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-razorpay-signature, x-webhook-signature");
    response.headers.set("Vary", "Origin");
  }
  return response;
}
