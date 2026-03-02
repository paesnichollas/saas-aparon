import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/rbac";

import AuthPageClient from "./auth-page-client";

const AuthPageFallback = () => {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <p className="text-sm">Carregando autenticação...</p>
    </main>
  );
};

interface AuthPageProps {
  searchParams: Promise<{
    forceLogin?: string | string[];
  }>;
}

const parseStringSearchParam = (value: string | string[] | undefined) => {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const AuthPage = async ({ searchParams }: AuthPageProps) => {
  const resolvedSearchParams = await searchParams;
  const forceLogin = parseStringSearchParam(resolvedSearchParams.forceLogin);
  const user = await getSessionUser();

  if (user && forceLogin !== "1") {
    redirect("/");
  }

  return (
    <Suspense fallback={<AuthPageFallback />}>
      <AuthPageClient />
    </Suspense>
  );
};

export default AuthPage;
