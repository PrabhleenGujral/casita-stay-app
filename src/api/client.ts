import type { z } from "zod";
import { errorBodySchema } from "./schemas";

export const API_BASE = "/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class InvalidResponseError extends Error {
  issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    super("The server sent a response we could not read.");
    this.name = "InvalidResponseError";
    this.issues = issues;
  }
}

export function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

async function readErrorMessage(response: Response) {
  try {
    const body = errorBodySchema.safeParse(await response.json());
    if (body.success) return body.data.message;
  } catch {
    // Ignore errors, return generic message below
  }
  return "Something went wrong while contacting the server.";
}

export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit
): Promise<T> {
  const url = new URL(API_BASE + path, window.location.origin);
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  const result = schema.safeParse(await response.json());
  if (!result.success) {
    console.error(`Invalid response from ${path}`, result.error.issues);
    throw new InvalidResponseError(result.error.issues);
  }
  return result.data;
}
