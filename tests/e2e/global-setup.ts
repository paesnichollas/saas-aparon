import { execSync } from "node:child_process";

const REQUIRED_TEST_DATABASE_MARKER = "aparatus_e2e";

const runCommand = (command: string) => {
  execSync(command, {
    stdio: "inherit",
    env: process.env,
  });
};

const resetDatabase = () => {
  runCommand("pnpm prisma db push --force-reset");
};

const validateTestDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (!databaseUrl) {
    throw new Error("[playwright globalSetup] DATABASE_URL is required.");
  }

  const isLocalDatabase =
    databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

  if (!isLocalDatabase) {
    throw new Error(
      "[playwright globalSetup] DATABASE_URL must target a local database for E2E.",
    );
  }

  let databaseName = "";

  try {
    const parsedDatabaseUrl = new URL(databaseUrl);
    databaseName = decodeURIComponent(parsedDatabaseUrl.pathname).replace(/^\/+/, "");
  } catch {
    throw new Error("[playwright globalSetup] DATABASE_URL is invalid.");
  }

  if (!databaseName.includes(REQUIRED_TEST_DATABASE_MARKER)) {
    throw new Error(
      `[playwright globalSetup] DATABASE_URL must target a database containing '${REQUIRED_TEST_DATABASE_MARKER}'.`,
    );
  }
};

const globalSetup = async () => {
  validateTestDatabaseUrl();

  resetDatabase();
  runCommand("pnpm tsx prisma/seed.test.ts");
};

export default globalSetup;
