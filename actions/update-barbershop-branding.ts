"use server";

import { ensureBarbershopPublicSlug } from "@/data/barbershops";
import { protectedActionClient } from "@/lib/action-client";
import { revalidatePublicBarbershopCache } from "@/lib/cache-invalidation";
import { DEFAULT_BANNER_IMAGE_URL } from "@/lib/default-images";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const inputSchema = z.object({
  barbershopId: z.uuid(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(1000),
  address: z.string().trim().min(5).max(160),
  phones: z.array(z.string().trim().min(8).max(30)).min(1).max(6),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  slug: z.string().trim().min(3).max(60).regex(slugRegex),
});

const normalizeOptionalValue = (value: string | null | undefined) => {
  const normalizedValue = value?.trim() ?? "";
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const hasValidImageUrl = (value: string) => {
  if (value.startsWith("/")) {
    return true;
  }

  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
};

export const updateBarbershopBranding = protectedActionClient
  .inputSchema(inputSchema)
  .action(
    async ({
      parsedInput: {
        barbershopId,
        name,
        description,
        address,
        phones,
        imageUrl,
        slug,
      },
      ctx: { user },
    }) => {
      const barbershop = await prisma.barbershop.findFirst({
        where: {
          id: barbershopId,
          ownerId: user.id,
        },
        select: {
          id: true,
          slug: true,
        },
      });

      if (!barbershop) {
        returnValidationErrors(inputSchema, {
          _errors: ["Barbearia não encontrada ou sem permissão de edição."],
        });
      }

      const existingBarbershopWithSlug = await prisma.barbershop.findFirst({
        where: {
          slug,
          NOT: {
            id: barbershopId,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingBarbershopWithSlug) {
        returnValidationErrors(inputSchema, {
          _errors: ["Slug já está em uso por outra barbearia."],
        });
      }

      const normalizedImageUrl = normalizeOptionalValue(imageUrl);
      const resolvedImageUrl = normalizedImageUrl ?? DEFAULT_BANNER_IMAGE_URL;
      const normalizedPhones = phones.map((phone) => phone.trim()).filter(Boolean);

      if (normalizedPhones.length === 0) {
        returnValidationErrors(inputSchema, {
          _errors: ["Informe pelo menos um telefone de contato."],
        });
      }

      if (!hasValidImageUrl(resolvedImageUrl)) {
        returnValidationErrors(inputSchema, {
          _errors: ["A imagem de fundo enviada é inválida."],
        });
      }

      const updatedBarbershop = await prisma.barbershop.update({
        where: {
          id: barbershopId,
        },
        data: {
          name,
          description,
          address,
          phones: normalizedPhones,
          imageUrl: resolvedImageUrl,
          slug,
        },
        select: {
          id: true,
          name: true,
          description: true,
          address: true,
          phones: true,
          imageUrl: true,
          slug: true,
        },
      });

      const publicSlug = await ensureBarbershopPublicSlug(updatedBarbershop.id);

      revalidatePath("/owner");
      revalidatePublicBarbershopCache({
        barbershopId: updatedBarbershop.id,
        slug: updatedBarbershop.slug,
        previousSlug: barbershop.slug,
        publicSlug,
      });

      return {
        success: true,
        name: updatedBarbershop.name,
        description: updatedBarbershop.description,
        address: updatedBarbershop.address,
        phones: updatedBarbershop.phones,
        imageUrl: updatedBarbershop.imageUrl,
        slug: updatedBarbershop.slug,
      };
    },
  );

