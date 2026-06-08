"use client";

import { useState } from "react";

import { SearchAndSelect } from "@/components/features/search-and-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Quiz } from "@/types";
import type { MediaItem } from "@/services/media-api";
import { useQueryClient } from "@tanstack/react-query";
import { createQuiz, updateQuiz } from "@/services/quiz/quiz-service";

interface QuizFormDialogProps {
  quiz: Quiz | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Segédfüggvény a dátum formázásához
function formatDateForInput(date: Date): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

/**
 * Belső komponens a form tartalmának
 */
function QuizFormContent({
  quiz,
  onSuccess,
}: {
  quiz: Quiz | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: quiz?.title || "",
    titleHu: quiz?.titleHu || "",
    description: quiz?.description || "",
    date: quiz?.date ? formatDateForInput(quiz.date) : "",
    time: quiz?.time || "20:00",
    location: quiz?.location || "BarCraft Corvin",
    category: quiz?.category || "",
    imageUrl: quiz?.imageUrl || "",
    isActive: quiz?.isActive ?? false,
  });

  const handleMediaSelect = (item: MediaItem) => {
    setFormData((prev) => ({
      ...prev,
      title: item.originalTitle,
      titleHu: item.title !== item.originalTitle ? item.title : "",
      imageUrl: item.imageUrl || "",
      category: item.categoryLabel,
      description: item.description || prev.description,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = {
      ...formData,
      date: new Date(formData.date),
    };

    const result = quiz
      ? await updateQuiz(quiz.id, data)
      : await createQuiz(data);
    setIsSubmitting(false);

    if (result.success) {
      await queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      onSuccess();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col max-w-full gap-3 sm:gap-4"
    >
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Label className="text-xs sm:text-sm">Média keresése</Label>
        <SearchAndSelect
          onSelect={handleMediaSelect}
          selectedTitle={formData.title || undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Eredeti cím</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="titleHu">Magyar cím (opcionális)</Label>
          <Input
            id="titleHu"
            value={formData.titleHu}
            onChange={(e) =>
              setFormData({ ...formData, titleHu: e.target.value })
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Leírás</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Dátum</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="time">Időpont</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Helyszín</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Kategória</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="imageUrl">Borítókép URL</Label>
        <Input
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) =>
            setFormData({ ...formData, imageUrl: e.target.value })
          }
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked })
          }
        />
        <Label htmlFor="isActive">Aktív (megjelenik a látogatóknak)</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Mentés..."
            : quiz
              ? "Módosítások mentése"
              : "Kvíz létrehozása"}
        </Button>
      </div>
    </form>
  );
}

export function QuizFormDialog({
  quiz,
  open,
  onOpenChange,
  onSuccess,
}: QuizFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] sm:max-w-2xl overflow-y-auto p-6 sm:p-10">
        <DialogHeader>
          <DialogTitle>
            {quiz ? "Kvíz Szerkesztése" : "Új Kvíz Létrehozása"}
          </DialogTitle>
          <DialogDescription>
            {quiz
              ? "Módosítsd a kvíz adatait."
              : "Keress egy médiát és add meg a részleteket."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <QuizFormContent
            key={quiz?.id || "new"}
            quiz={quiz}
            onSuccess={() => {
              onSuccess();
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
