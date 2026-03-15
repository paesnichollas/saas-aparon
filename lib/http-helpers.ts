import { NextResponse } from "next/server";

export const jsonNoStore = <T>(data: T, status = 200) => {
  const response = NextResponse.json(data, { status });
  response.headers.set("cache-control", "no-store");
  return response;
};

export const jsonError = (error: string, status: number) => {
  return NextResponse.json({ error }, { status });
};

export const safeParseJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};
