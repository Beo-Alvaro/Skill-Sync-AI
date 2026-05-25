import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.flatten() },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  console.error("[api:error]", error);
  return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
}
