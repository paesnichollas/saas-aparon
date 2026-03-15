"use server";

import { getBarberByIdWithOwnerCheck } from "@/data/barbers";
import { protectedActionClient } from "@/lib/action-client";
import { revalidateOwnerBarbershopCache } from "@/lib/cache-invalidation";
import { normalizeOptionalText } from "@/lib/string-helpers";
import { isValidImageUrl } from "@/lib/url-helpers";
import { prisma } from "@/lib/prisma";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const inputSchema = z.object({
  barberId: z.uuid(),
  name: z.string().trim().min(2).max(80),
  imageUrl: z.string().trim().max(500).nullable().optional(),
});

export const updateBarber = protectedActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { barberId, name, imageUrl }, ctx: { user } }) => {
    const barber = await getBarberByIdWithOwnerCheck(barberId, user.id);

    if (!barber) {
      returnValidationErrors(inputSchema, {
        _errors: ["Barbeiro não encontrado ou sem permissão de edição."],
      });
    }

    const normalizedImageUrl = normalizeOptionalText(imageUrl);

    if (normalizedImageUrl && !isValidImageUrl(normalizedImageUrl)) {
      returnValidationErrors(inputSchema, {
        _errors: ["A imagem enviada é inválida."],
      });
    }

    const updatedBarber = await prisma.barber.update({
      where: {
        id: barber.id,
      },
      data: {
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
      barbershopId: barber.barbershop.id,
      slug: barber.barbershop.slug,
      publicSlug: barber.barbershop.publicSlug,
    });

    return updatedBarber;
  });

