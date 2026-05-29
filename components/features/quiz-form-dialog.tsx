'use client';

import { useState } from 'react';
import { createQuiz, updateQuiz } from '@/services/quiz-service';
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
import type { Quiz } from '@/types';

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
      onSuccess();
      // Reset form
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
  };

  // Update form when quiz changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && quiz) {
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
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{quiz ? 'Kvíz Szerkesztése' : 'Új Kvíz Létrehozása'}</DialogTitle>
          <DialogDescription>
            {quiz ? 'Módosítsd a kvíz adatait.' : 'Add meg az új kvíz adatait.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                placeholder="pl. Animáció"
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
