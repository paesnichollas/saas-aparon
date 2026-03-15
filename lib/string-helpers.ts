export const normalizeOptionalText = (value: string | null | undefined) => {
  const normalizedValue = value?.trim() ?? "";
  return normalizedValue.length > 0 ? normalizedValue : null;
};

export const normalizeForMessageMatch = (value: string) => {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export const normalizePhones = (
  phones: string[] | undefined,
  options?: {
    allowEmpty?: boolean;
    fallbackWhenMissing?: string[];
  },
) => {
  if (!phones) {
    if (options?.fallbackWhenMissing) {
      return [...options.fallbackWhenMissing];
    }

    return undefined;
  }

  const normalizedPhones = phones.map((phone) => phone.trim()).filter(Boolean);

  if (normalizedPhones.length === 0 && !options?.allowEmpty) {
    return null;
  }

  return normalizedPhones;
};
