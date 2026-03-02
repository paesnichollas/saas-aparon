import { describe, expect, it } from "vitest";

import {
  buildBookingReceiptMessage,
  buildBookingReceiptWhatsAppLink,
  buildWhatsAppDeepLink,
} from "@/lib/whatsapp";

const createBookingDate = () => {
  return new Date(2026, 2, 10, 14, 30, 0);
};

describe("whatsapp", () => {
  it("builds deep link from Brazilian mobile phone in local format", () => {
    const url = buildWhatsAppDeepLink({
      phone: "(11) 98765-4321",
      message: "Olá João",
    });

    expect(url).toBe("https://wa.me/5511987654321?text=Ol%C3%A1%20Jo%C3%A3o");
  });

  it("builds deep link from phone already containing +55", () => {
    const url = buildWhatsAppDeepLink({
      phone: "+55 (21) 3344-5566",
      message: "Seu horário foi confirmado",
    });

    expect(url).toBe(
      "https://wa.me/552133445566?text=Seu%20hor%C3%A1rio%20foi%20confirmado",
    );
  });

  it("returns null for invalid phone", () => {
    const url = buildWhatsAppDeepLink({
      phone: "12345",
      message: "Mensagem válida",
    });

    expect(url).toBeNull();
  });

  it("returns null for blank message", () => {
    const url = buildWhatsAppDeepLink({
      phone: "(11) 99999-9999",
      message: "   ",
    });

    expect(url).toBeNull();
  });

  it("builds booking receipt message with total", () => {
    const message = buildBookingReceiptMessage({
      customerName: "João",
      barberName: "Jadielson da Silva",
      bookingStartAt: createBookingDate(),
      serviceNames: ["Corte", "Barba"],
      totalPriceInCents: 9000,
    });

    expect(message).toContain("Comprovante de agendamento");
    expect(message).toContain("👤 Cliente: João");
    expect(message).toContain("📅 Data: 10/03/2026");
    expect(message).toContain("🕒 Horário: 14:30");
    expect(message).toContain("👤 Profissional: Jadielson da Silva");
    expect(message).toContain("🛎 Serviço: Corte, Barba");
    expect(message).toContain("💳 Valor: R$ 90,00");
  });

  it("builds booking receipt message without total and with fallback service", () => {
    const message = buildBookingReceiptMessage({
      customerName: "",
      barberName: "",
      bookingStartAt: createBookingDate(),
      serviceNames: [],
      totalPriceInCents: null,
    });

    expect(message).toContain("👤 Cliente: Cliente");
    expect(message).toContain("👤 Profissional: Não informado");
    expect(message).toContain("🛎 Serviço: Serviço não informado");
    expect(message).not.toContain("💳 Valor:");
  });

  it("builds booking receipt WhatsApp link", () => {
    const url = buildBookingReceiptWhatsAppLink({
      phone: "(11) 98765-4321",
      customerName: "João",
      barberName: "Jadielson da Silva",
      bookingStartAt: createBookingDate(),
      serviceNames: ["Corte"],
      totalPriceInCents: 5000,
    });

    expect(url).toContain("https://wa.me/5511987654321?text=");
    expect(url).toContain(encodeURIComponent("Comprovante de agendamento"));
  });

  it("returns null booking receipt link for invalid phone", () => {
    const url = buildBookingReceiptWhatsAppLink({
      phone: "12345",
      customerName: "João",
      barberName: "Jadielson da Silva",
      bookingStartAt: createBookingDate(),
      serviceNames: ["Corte"],
      totalPriceInCents: 5000,
    });

    expect(url).toBeNull();
  });
});
