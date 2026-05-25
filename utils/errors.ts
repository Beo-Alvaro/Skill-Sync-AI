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

function isSupabaseError(error: unknown): error is { code?: string; message: string; details?: unknown } {
  return Boolean(error && typeof error === "object" && "message" in error);
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

  if (isSupabaseError(error)) {
    console.error("[api:error]", error);
    return NextResponse.json(
      {
        error: error.message,
        details: {
          code: error.code,
          details: error.details
        }
      },
      { status: 500 }
    );
  }

  console.error("[api:error]", error);
  return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
}
