import {
  BR_PHONE_MAX_LENGTH,
  BR_PHONE_MIN_LENGTH,
  getBrPhoneDigitsFromInput,
} from "@/lib/phone";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BuildWhatsAppDeepLinkInput {
  phone: string;
  message: string;
}

interface BuildBookingReceiptMessageInput {
  customerName?: string | null;
  barberName?: string | null;
  bookingStartAt: Date;
  serviceNames: string[];
  totalPriceInCents?: number | null;
}

interface BuildBookingReceiptWhatsAppLinkInput
  extends BuildBookingReceiptMessageInput {
  phone: string;
}

const BRAZIL_COUNTRY_CODE = "55";
const DEFAULT_CUSTOMER_NAME = "Cliente";
const DEFAULT_BARBER_NAME = "Não informado";
const DEFAULT_SERVICE_NAME = "Serviço não informado";

const normalizeWhatsAppPhone = (phone: string) => {
  const localDigits = getBrPhoneDigitsFromInput(phone);

  if (
    localDigits.length !== BR_PHONE_MIN_LENGTH &&
    localDigits.length !== BR_PHONE_MAX_LENGTH
  ) {
    return null;
  }

  return `${BRAZIL_COUNTRY_CODE}${localDigits}`;
};

export const buildWhatsAppDeepLink = ({
  phone,
  message,
}: BuildWhatsAppDeepLinkInput) => {
  const normalizedPhone = normalizeWhatsAppPhone(phone);

  if (!normalizedPhone) {
    return null;
  }

  const normalizedMessage = message.trim();

  if (!normalizedMessage) {
    return null;
  }

  const encodedMessage = encodeURIComponent(normalizedMessage);
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
};

const getServiceNamesLabel = (serviceNames: string[]) => {
  const normalizedServiceNames = serviceNames
    .map((serviceName) => serviceName.trim())
    .filter((serviceName) => serviceName.length > 0);

  if (normalizedServiceNames.length > 0) {
    return normalizedServiceNames.join(", ");
  }

  return DEFAULT_SERVICE_NAME;
};

export const buildBookingReceiptMessage = ({
  customerName,
  barberName,
  bookingStartAt,
  serviceNames,
  totalPriceInCents,
}: BuildBookingReceiptMessageInput) => {
  const normalizedCustomerName = customerName?.trim().length
    ? customerName.trim()
    : DEFAULT_CUSTOMER_NAME;
  const normalizedBarberName = barberName?.trim().length
    ? barberName.trim()
    : DEFAULT_BARBER_NAME;
  const bookingDateLabel = format(bookingStartAt, "dd/MM/yyyy", {
    locale: ptBR,
  });
  const bookingTimeLabel = format(bookingStartAt, "HH:mm", {
    locale: ptBR,
  });
  const serviceNamesLabel = getServiceNamesLabel(serviceNames);
  const totalLabel =
    typeof totalPriceInCents === "number"
      ? `- Valor: ${formatCurrency(totalPriceInCents)}`
      : "";

  return [
    "Comprovante de agendamento",
    "",
    `- Cliente: ${normalizedCustomerName}`,
    `- Data: ${bookingDateLabel}`,
    `- Horário: ${bookingTimeLabel}`,
    `- Profissional: ${normalizedBarberName}`,
    `- Serviço: ${serviceNamesLabel}`,
    totalLabel,
  ]
    .filter((line) => line.length > 0)
    .join("\n");
};

export const buildBookingReceiptWhatsAppLink = ({
  phone,
  ...messageInput
}: BuildBookingReceiptWhatsAppLinkInput) => {
  const message = buildBookingReceiptMessage(messageInput);

  return buildWhatsAppDeepLink({
    phone,
    message,
  });
};
