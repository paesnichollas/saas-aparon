-- AlterTable
ALTER TABLE "Barbershop"
ADD COLUMN "homePremiumTitle" TEXT NOT NULL DEFAULT 'Experiencia premium na home',
ADD COLUMN "homePremiumDescription" TEXT NOT NULL DEFAULT 'Sua barbearia fica em destaque para todos os acessos em modo exclusivo.',
ADD COLUMN "homePremiumChips" TEXT[] NOT NULL DEFAULT ARRAY['Atendimento personalizado', 'Reserva em poucos passos', 'Visual profissional'];

-- AlterTable
ALTER TABLE "BarbershopService"
ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
