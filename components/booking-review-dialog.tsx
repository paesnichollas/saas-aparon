"use client";

import { createReview } from "@/actions/create-review";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_REVIEW_RATING,
  MIN_REVIEW_RATING,
  isValidReviewRating,
} from "@/lib/review";
import { cn, formatRating } from "@/lib/utils";
import { Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface BookingReviewDialogProps {
  bookingId: string;
  onReviewed: () => void;
}

const COMMENT_MAX_LENGTH = 600;

const getValidationErrorMessage = (validationErrors: unknown) => {
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

  return getFirstErrorFromNode(validationErrors);
};

const BookingReviewDialog = ({
  bookingId,
  onReviewed,
}: BookingReviewDialogProps) => {
  const router = useRouter();
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { executeAsync, isPending } = useAction(createReview);
  const hasValidRating = useMemo(() => isValidReviewRating(rating), [rating]);

  const handleSubmit = async () => {
    if (!hasValidRating) {
      toast.error("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    const result = await executeAsync({
      bookingId,
      rating,
      comment,
    });

    const validationErrorMessage = getValidationErrorMessage(result.validationErrors);

    if (validationErrorMessage) {
      toast.error(validationErrorMessage);
      return;
    }

    if (result.serverError || !result.data) {
      toast.error("Não foi possível enviar sua avaliação. Tente novamente.");
      return;
    }

    toast.success("Avaliação enviada com sucesso.");
    setDialogIsOpen(false);
    setRating(0);
    setComment("");
    onReviewed();
    router.refresh();
  };

  return (
    <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex-1 rounded-full" data-testid="booking-review-open">
          Avaliar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Avaliar atendimento</DialogTitle>
          <DialogDescription>
            Escolha de 1 a 5 estrelas para avaliar sua experiência.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: MAX_REVIEW_RATING }, (_, index) => {
              const starValue = index + 1;
              const isSelected = starValue <= rating;

              return (
                <button
                  key={starValue}
                  type="button"
                  aria-label={`${starValue} estrela${starValue > 1 ? "s" : ""}`}
                  className="rounded-full p-1 transition-opacity hover:opacity-80"
                  onClick={() => setRating(starValue)}
                  disabled={isPending}
                  data-testid={`booking-review-star-${starValue}`}
                >
                  <Star
                    className={cn(
                      "size-6 transition-colors",
                      isSelected
                        ? "fill-primary text-primary"
                        : "fill-transparent text-muted-foreground",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <p className="text-muted-foreground text-center text-sm">
            {hasValidRating
              ? `Nota selecionada: ${formatRating(rating)}`
              : `Selecione uma nota de ${MIN_REVIEW_RATING} a ${MAX_REVIEW_RATING} estrelas.`}
          </p>

          <div className="space-y-2">
            <Textarea
              placeholder="Comentário opcional sobre o atendimento."
              value={comment}
              maxLength={COMMENT_MAX_LENGTH}
              onChange={(event) => setComment(event.target.value)}
              disabled={isPending}
            />
            <p className="text-muted-foreground text-right text-xs">
              {comment.length}/{COMMENT_MAX_LENGTH}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDialogIsOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!hasValidRating || isPending}
            data-testid="booking-review-submit"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "Enviar avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingReviewDialog;
