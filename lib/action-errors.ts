export const getValidationErrorMessage = (validationErrors: unknown) => {
  if (!validationErrors || typeof validationErrors !== "object") {
    return null;
  }

  const rootErrors = (validationErrors as { _errors?: unknown })._errors;

  if (Array.isArray(rootErrors) && typeof rootErrors[0] === "string") {
    return rootErrors[0];
  }

  return null;
};

const getFirstErrorFromNode = (value: unknown): string | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const errors = (value as { _errors?: unknown })._errors;

  if (Array.isArray(errors)) {
    const firstStringError = errors.find(
      (errorItem): errorItem is string =>
        typeof errorItem === "string" && errorItem.trim().length > 0,
    );

    if (firstStringError) {
      return firstStringError;
    }
  }

  for (const nestedValue of Object.values(value as Record<string, unknown>)) {
    const nestedError = getFirstErrorFromNode(nestedValue);

    if (nestedError) {
      return nestedError;
    }
  }

  return null;
};

export const getValidationErrorMessageWithNested = (validationErrors: unknown) => {
  return getFirstErrorFromNode(validationErrors);
};

export const getServerErrorMessage = (serverError: unknown) => {
  if (typeof serverError === "string" && serverError.trim().length > 0) {
    return serverError.trim();
  }

  return null;
};

export const getActionErrorMessage = (
  validationErrors: unknown,
  serverError: unknown,
  fallbackMessage: string,
) => {
  const validationMessage = getValidationErrorMessage(validationErrors);

  if (validationMessage) {
    return validationMessage;
  }

  if (serverError) {
    return fallbackMessage;
  }

  return null;
};

export const getActionErrorMessageFromError = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
};
