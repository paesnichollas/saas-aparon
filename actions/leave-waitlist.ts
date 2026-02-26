"use server";

import { protectedActionClient } from "@/lib/action-client";
import { revalidateBookingSurfaces } from "@/lib/cache-invalidation";
import { prisma } from "@/lib/prisma";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const inputSchema = z.object({
  entryId: z.uuid(),
});

export const leaveWaitlist = protectedActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { entryId }, ctx: { user } }) => {
    const entry = await prisma.waitlistEntry.findFirst({
      where: {
        id: entryId,
        userId: user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!entry) {
      returnValidationErrors(inputSchema, {
        _errors: ["Entrada de fila nao encontrada."],
      });
    }

    if (entry.status !== "ACTIVE") {
      returnValidationErrors(inputSchema, {
        _errors: ["A entrada da fila nao esta ativa."],
      });
    }

    const updateResult = await prisma.waitlistEntry.updateMany({
      where: {
        id: entry.id,
        userId: user.id,
        status: "ACTIVE",
      },
      data: {
        status: "CANCELED",
      },
    });

    if (updateResult.count === 0) {
      returnValidationErrors(inputSchema, {
        _errors: ["Nao foi possivel sair da fila agora. Tente novamente."],
      });
    }

    revalidateBookingSurfaces({
      includeHome: false,
      includeOwner: false,
      includeAdmin: false,
    });

    return {
      success: true,
      entryId: entry.id,
    };
  });
