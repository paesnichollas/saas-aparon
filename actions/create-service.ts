"use server";

import { getOwnerBarbershopContextForMutation } from "@/data/barbershops";
import { protectedActionClient } from "@/lib/action-client";
import { revalidateOwnerBarbershopCache } from "@/lib/cache-invalidation";
import { resolveServiceImageUrl } from "@/lib/default-images";
import { normalizeOptionalText } from "@/lib/string-helpers";
import { isValidImageUrl } from "@/lib/url-helpers";
import { prisma } from "@/lib/prisma";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const inputSchema = z.object({
  barbershopId: z.uuid(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  priceInCents: z.number().int().min(0).max(1_000_000),
  durationInMinutes: z.number().int().min(5).max(240),
});

export const createService = protectedActionClient
  .inputSchema(inputSchema)
  .action(
    async ({
      parsedInput: {
        barbershopId,
        name,
        description,
        imageUrl,
        priceInCents,
        durationInMinutes,
      },
      ctx: { user },
    }) => {
      const barbershop = await getOwnerBarbershopContextForMutation(
        barbershopId,
        user.id,
      );

      if (!barbershop) {
        returnValidationErrors(inputSchema, {
          _errors: ["Barbearia não encontrada ou sem permissão de edição."],
        });
      }

      const normalizedName = name.trim();
      const normalizedDescription = normalizeOptionalText(description);
      const normalizedImageUrl = normalizeOptionalText(imageUrl);
      const resolvedImageUrl = resolveServiceImageUrl(
        normalizedImageUrl,
        normalizedName,
      );

      if (normalizedImageUrl && !isValidImageUrl(normalizedImageUrl)) {
        returnValidationErrors(inputSchema, {
          _errors: ["A imagem enviada é inválida."],
        });
      }

      const createdService = await prisma.barbershopService.create({
        data: {
          barbershopId: barbershop.id,
          name: normalizedName,
          description: normalizedDescription,
          imageUrl: resolvedImageUrl,
          priceInCents,
          durationInMinutes,
        },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          priceInCents: true,
          durationInMinutes: true,
        },
      });

      revalidateOwnerBarbershopCache({
        barbershopId: barbershop.id,
        slug: barbershop.slug,
        publicSlug: barbershop.publicSlug,
      });

      return createdService;
    },
  );

