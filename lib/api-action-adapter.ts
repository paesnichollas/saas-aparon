import { auth } from "@/lib/auth";
import {
  getServerErrorMessage,
  getValidationErrorMessage,
} from "@/lib/action-errors";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

type ActionResult<T> = {
  data?: T;
  validationErrors?: unknown;
  serverError?: string;
};

type JsonResponseOptions = {
  successStatus?: number;
  conflictStatus?: number;
  unauthorizedMessage?: string;
  noDataMessage?: string;
};

const DEFAULT_UNAUTHORIZED_MESSAGE = "Não autorizado.";

const isUnauthorizedErrorMessage = (message: string) => {
  const normalized = message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return (
    normalized.includes("nao autorizado") ||
    normalized.includes("não autorizado") ||
    normalized.includes("login")
  );
};

export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  return session.user;
};

export const handleActionJsonResponse = <T>(
  result: ActionResult<T>,
  options: JsonResponseOptions = {},
) => {
  const {
    successStatus = 200,
    conflictStatus = 400,
    noDataMessage = "Operação não concluída.",
  } = options;

  const validationMessage = getValidationErrorMessage(result.validationErrors);
  if (validationMessage) {
    const isConflict =
      validationMessage.toLowerCase().includes("agendad") ||
      validationMessage.toLowerCase().includes("ocupad");
    return NextResponse.json(
      { error: validationMessage },
      { status: isConflict ? 409 : conflictStatus },
    );
  }

  const serverMessage = getServerErrorMessage(result.serverError);
  if (serverMessage) {
    const status = isUnauthorizedErrorMessage(serverMessage) ? 401 : 500;
    return NextResponse.json(
      { error: serverMessage },
      { status },
    );
  }

  if (!result.data) {
    return NextResponse.json(
      { error: noDataMessage },
      { status: 500 },
    );
  }

  return NextResponse.json(result.data, { status: successStatus });
};

export const parseBody = async <T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Requisição inválida." },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Requisição inválida." },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: parsed.data };
};

export const parseParams = async <T>(
  params: Promise<Record<string, string>>,
  schema: z.ZodType<T>,
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> => {
  const rawParams = await params;
  const parsed = schema.safeParse(rawParams);

  if (!parsed.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Parâmetros inválidos." },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: parsed.data };
};
