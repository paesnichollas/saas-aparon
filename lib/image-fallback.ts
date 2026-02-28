import { DEFAULT_BANNER_IMAGE_URL } from "@/lib/default-images";

export const resolveBarbershopImageUrl = (
  imageUrl: string | null | undefined,
) => {
  const normalizedImageUrl = imageUrl?.trim() ?? "";

  if (normalizedImageUrl.length > 0) {
    return normalizedImageUrl;
  }

  return DEFAULT_BANNER_IMAGE_URL;
};
