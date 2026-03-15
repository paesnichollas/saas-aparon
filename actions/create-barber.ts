"use server";

import { getOwnerBarbershopContextForMutation } from "@/data/barbershops";
import { protectedActionClient } from "@/lib/action-client";
import { revalidateOwnerBarbershopCache } from "@/lib/cache-invalidation";
import { normalizeOptionalText } from "@/lib/string-helpers";
import { isValidImageUrl } from "@/lib/url-helpers";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const inputSchema = z.object({
  barbershopId: z.uuid(),
  name: z.string().trim().min(2).max(80),
  imageUrl: z.string().trim().max(500).nullable().optional(),
});

export const createBarber = protectedActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { barbershopId, name, imageUrl }, ctx: { user } }) => {
    const barbershop = await getOwnerBarbershopContextForMutation(barbershopId, user.id);

    if (!barbershop) {
      returnValidationErrors(inputSchema, {
        _errors: ["Barbearia não encontrada ou sem permissão de edição."],
      });
    }

    const normalizedImageUrl = normalizeOptionalText(imageUrl);

    if (normalizedImageUrl && !isValidImageUrl(normalizedImageUrl)) {
      returnValidationErrors(inputSchema, {
        _errors: ["A imagem enviada é inválida."],
      });
    }

    const { prisma } = await import("@/lib/prisma");
    const createdBarber = await prisma.barber.create({
      data: {
        barbershopId: barbershop.id,
        name: name.trim(),
        imageUrl: normalizedImageUrl,
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    });

    revalidateOwnerBarbershopCache({
      barbershopId: barbershop.id,
      slug: barbershop.slug,
      publicSlug: barbershop.publicSlug,
    });

    return createdBarber;
  });

