import { type BarbershopListItem } from "@/data/barbershops";
import { resolveBarbershopImageUrl } from "@/lib/image-fallback";
import { formatRating } from "@/lib/utils";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BarbershopItemProps {
  barbershop: BarbershopListItem;
}

const BarbershopItem = ({ barbershop }: BarbershopItemProps) => {
  const baseHref = barbershop.isExclusive
    ? `/exclusive/${barbershop.id}`
    : `/b/${barbershop.slug}`;
  const barbershopHref = `${baseHref}?from=general_list`;
  const barbershopImageUrl = resolveBarbershopImageUrl(barbershop.imageUrl);
  const hasRatings = barbershop.ratingsCount > 0;

  return (
    <Link
      href={barbershopHref}
      className="relative min-h-[200px] min-w-[290px] rounded-xl"
      data-testid={`barbershop-card-${barbershop.slug}`}
    >
      <div className="bg-background/90 text-foreground absolute top-3 right-3 z-20 inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs font-semibold">
        {hasRatings ? (
          <Star className="text-primary size-3.5 fill-current" />
        ) : null}
        <span>{hasRatings ? formatRating(barbershop.avgRating) : "Novo"}</span>
      </div>
      <div className="absolute top-0 left-0 z-10 h-full w-full rounded-lg bg-linear-to-t from-black to-transparent" />
      <Image
        src={barbershopImageUrl}
        alt={barbershop.name}
        fill
        className="rounded-xl object-cover"
        sizes="(max-width: 48rem) 90vw, 18.125rem"
      />
      <div className="absolute right-0 bottom-0 left-0 z-20 p-4">
        <h3 className="text-background dark:text-foreground text-lg font-bold">
          {barbershop.name}
        </h3>
        <p className="text-background dark:text-foreground text-xs">
          {barbershop.address}
        </p>
      </div>
    </Link>
  );
};

export default BarbershopItem;
