'use client';

import { useState, useEffect } from 'react';
import { createQuiz, updateQuiz } from '@/services/quiz-service';
import { triggerStorageRefresh } from '@/hooks/use-mock-data';
import { SearchAndSelect } from '@/components/features/search-and-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import Image from 'next/image';
import type { Quiz } from '@/types';
import type { MediaItem } from '@/services/media-api';

interface QuizFormDialogProps {
  quiz: Quiz | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function QuizFormDialog({ quiz, open, onOpenChange, onSuccess }: QuizFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: quiz?.title || '',
    titleHu: quiz?.titleHu || '',
    description: quiz?.description || '',
    date: quiz?.date ? formatDateForInput(quiz.date) : '',
    time: quiz?.time || '20:00',
    location: quiz?.location || 'BarCraft Corvin',
    category: quiz?.category || '',
    imageUrl: quiz?.imageUrl || '',
    isActive: quiz?.isActive ?? true,
  });

  function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Update form when quiz changes (for editing)
  useEffect(() => {
    if (open && quiz) {
      setFormData({
        title: quiz.title,
        titleHu: quiz.titleHu || '',
        description: quiz.description || '',
        date: formatDateForInput(quiz.date),
        time: quiz.time,
        location: quiz.location || 'BarCraft Corvin',
        category: quiz.category || '',
        imageUrl: quiz.imageUrl || '',
        isActive: quiz.isActive,
      });
    } else if (open && !quiz) {
      // Reset form for new quiz
      setFormData({
        title: '',
        titleHu: '',
        description: '',
        date: '',
        time: '20:00',
        location: 'BarCraft Corvin',
        category: '',
        imageUrl: '',
        isActive: true,
      });
    }
  }, [open, quiz]);

  const handleMediaSelect = (item: MediaItem) => {
    setFormData((prev) => ({
      ...prev,
      title: item.originalTitle,
      titleHu: item.title !== item.originalTitle ? item.title : '',
      imageUrl: item.imageUrl || '',
      category: item.categoryLabel,
      description: item.description || prev.description,
    }));
  };

  const clearSelectedMedia = () => {
    setFormData((prev) => ({
      ...prev,
      title: '',
      titleHu: '',
      imageUrl: '',
      category: '',
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
      triggerStorageRefresh();
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quiz ? 'Kvíz Szerkesztése' : 'Új Kvíz Létrehozása'}</DialogTitle>
          <DialogDescription>
            {quiz ? 'Módosítsd a kvíz adatait.' : 'Keress egy filmet, sorozatot vagy könyvet, majd add meg a részleteket.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Media Search Section */}
          <div className="flex flex-col gap-2">
            <Label>Média keresése</Label>
            <SearchAndSelect
              onSelect={handleMediaSelect}
              selectedTitle={formData.title || undefined}
            />
          </div>

          {/* Selected Media Preview */}
          {formData.title && (
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
              {formData.imageUrl ? (
                <div className="relative size-16 shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={formData.imageUrl}
                    alt={formData.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted">
                  <span className="text-xs text-muted-foreground">Nincs kép</span>
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1">
                <span className="font-medium">{formData.title}</span>
                {formData.titleHu && (
                  <span className="text-sm text-muted-foreground">{formData.titleHu}</span>
                )}
                {formData.category && (
                  <span className="text-xs text-muted-foreground">{formData.category}</span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={clearSelectedMedia}
              >
                <X className="size-4" />
                <span className="sr-only">Törlés</span>
              </Button>
            </div>
          )}

          {/* Manual Input Fields (can override or fill in missing data) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Cím (eredeti)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="pl. Disenchantment"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="titleHu">Cím (magyar)</Label>
            <Input
              id="titleHu"
              value={formData.titleHu}
              onChange={(e) => setFormData({ ...formData, titleHu: e.target.value })}
              placeholder="pl. A Kiábrándult Királylány"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Leírás</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Rövid leírás a kvízről..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Dátum</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Helyszín</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="pl. BarCraft Corvin"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Kategória</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="pl. Sorozat"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="imageUrl">Kép URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Aktív (látható a főoldalon)</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Mégse
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Mentés...' : quiz ? 'Mentés' : 'Létrehozás'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
