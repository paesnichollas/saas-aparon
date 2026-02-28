import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { resolveServiceImageUrl } from "@/lib/default-images";
import { cn, formatCurrency } from "@/lib/utils";

interface ExclusiveServiceRowCardProps {
  name: string;
  description: string | null;
  priceInCents: number;
  durationInMinutes: number;
  imageUrl: string | null;
  className?: string;
}

const ExclusiveServiceRowCard = ({
  name,
  description,
  priceInCents,
  durationInMinutes,
  imageUrl,
  className,
}: ExclusiveServiceRowCardProps) => {
  const resolvedImageUrl = resolveServiceImageUrl(imageUrl, name);
  const serviceDescription = description?.trim() || "Sem descrição.";

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border sm:h-24 sm:w-24">
        <Image
          src={resolvedImageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 80px, 96px"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-sm font-semibold sm:text-base">{name}</p>
          <p className="shrink-0 text-sm font-semibold sm:text-base">
            {formatCurrency(priceInCents)}
          </p>
        </div>

        <p className="text-muted-foreground line-clamp-2 text-xs sm:text-sm">
          {serviceDescription}
        </p>

        <Badge variant="secondary" className="w-fit text-xs">
          {durationInMinutes} min
        </Badge>
      </div>
    </div>
  );
};

export default ExclusiveServiceRowCard;
