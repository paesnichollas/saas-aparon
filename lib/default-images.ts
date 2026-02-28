const DEFAULT_SERVICE_IMAGE_SOURCES = [
  {
    name: "Corte de Cabelo",
    prefixes: ["corte"],
    imageUrl:
      "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
  },
  {
    name: "Barba",
    prefixes: ["barba"],
    imageUrl:
      "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png",
  },
  {
    name: "P\u00e9zinho",
    prefixes: ["pezinho"],
    imageUrl:
      "https://utfs.io/f/8a457cda-f768-411d-a737-cdb23ca6b9b5-b3pegf.png",
  },
  {
    name: "Sobrancelha",
    prefixes: ["sobrancelha"],
    imageUrl:
      "https://utfs.io/f/2118f76e-89e4-43e6-87c9-8f157500c333-b0ps0b.png",
  },
  {
    name: "Massagem",
    prefixes: ["massagem"],
    imageUrl:
      "https://utfs.io/f/c4919193-a675-4c47-9f21-ebd86d1c8e6a-4oen2a.png",
  },
  {
    name: "Hidrata\u00e7\u00e3o",
    prefixes: ["hidratacao", "lavagem"],
    imageUrl:
      "https://utfs.io/f/8a457cda-f768-411d-a737-cdb23ca6b9b5-b3pegf.png",
  },
] as const;

export const DEFAULT_BANNER_IMAGE_URL = "/banner.png";

export const DEFAULT_SERVICE_FALLBACK_IMAGE_URL =
  "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png";

export const normalizeServiceName = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
};

export const DEFAULT_SERVICE_IMAGES = Object.freeze(
  Object.fromEntries(
    DEFAULT_SERVICE_IMAGE_SOURCES.map((service) => {
      return [normalizeServiceName(service.name), service.imageUrl];
    }),
  ),
) as Readonly<Record<string, string>>;

const hasMatchingServicePrefix = (
  normalizedServiceName: string,
  normalizedPrefix: string,
) => {
  return (
    normalizedServiceName === normalizedPrefix ||
    normalizedServiceName.startsWith(`${normalizedPrefix} `)
  );
};

const getServiceImageUrlByPrefix = (normalizedServiceName: string) => {
  for (const service of DEFAULT_SERVICE_IMAGE_SOURCES) {
    const hasMatch = service.prefixes.some((prefix) =>
      hasMatchingServicePrefix(
        normalizedServiceName,
        normalizeServiceName(prefix),
      ),
    );

    if (hasMatch) {
      return service.imageUrl;
    }
  }

  return null;
};

export const getDefaultServiceImageUrl = (serviceName: string) => {
  const normalizedServiceName = normalizeServiceName(serviceName);

  if (!normalizedServiceName) {
    return DEFAULT_SERVICE_FALLBACK_IMAGE_URL;
  }

  const imageUrlByPrefix = getServiceImageUrlByPrefix(normalizedServiceName);

  if (imageUrlByPrefix) {
    return imageUrlByPrefix;
  }

  return (
    DEFAULT_SERVICE_IMAGES[normalizedServiceName] ??
    DEFAULT_SERVICE_FALLBACK_IMAGE_URL
  );
};

export const resolveServiceImageUrl = (
  imageUrl: string | null | undefined,
  serviceName: string,
) => {
  const normalizedImageUrl = imageUrl?.trim() ?? "";

  if (normalizedImageUrl.length > 0) {
    return normalizedImageUrl;
  }

  return getDefaultServiceImageUrl(serviceName);
};
