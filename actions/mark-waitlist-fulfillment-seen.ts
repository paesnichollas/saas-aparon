"use server";

import { protectedActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const inputSchema = z.object({
  entryId: z.uuid(),
});

export const markWaitlistFulfillmentSeen = protectedActionClient
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
        fulfilledSeenAt: true,
      },
    });

    if (!entry) {
      returnValidationErrors(inputSchema, {
        _errors: ["Entrada da fila não encontrada."],
      });
    }

    if (entry.status !== "FULFILLED") {
      returnValidationErrors(inputSchema, {
        _errors: ["A entrada da fila ainda não foi contemplada."],
      });
    }

    if (entry.fulfilledSeenAt) {
      return {
        success: true,
        entryId: entry.id,
      };
    }

    await prisma.waitlistEntry.update({
      where: {
        id: entry.id,
      },
      data: {
        fulfilledSeenAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    return {
      success: true,
      entryId: entry.id,
    };
  });
