'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageIcon, Plus, Trash2, GripVertical } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SearchAndSelect, type MediaItem } from './search-and-select';
import type { Poll, PollFormData, PollOptionFormData, ApiResponse } from '@/types';

interface PollFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PollFormData) => Promise<ApiResponse<Poll>>;
  poll?: Poll | null;
}

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

function generateOptionId(): string {
  return `opt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

export function PollFormDialog({
  open,
  onOpenChange,
  onSubmit,
  poll,
}: PollFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [options, setOptions] = useState<PollOptionFormData[]>([
    { id: generateOptionId(), title: '', description: '', imageUrl: '' },
    { id: generateOptionId(), title: '', description: '', imageUrl: '' },
  ]);
  const [activeOptionIndex, setActiveOptionIndex] = useState<number | null>(null);

  // Reset form when dialog opens/closes or poll changes
  useEffect(() => {
    if (open) {
      if (poll) {
        // Editing existing poll - pre-fill form
        setTitle(poll.title);
        setDescription(poll.description || '');
        setIsActive(poll.isActive);
        const pollOptions = Object.values(poll.options).map(opt => ({
          id: opt.id,
          title: opt.title,
          description: opt.description || '',
          imageUrl: opt.imageUrl || '',
        }));
        setOptions(pollOptions.length >= MIN_OPTIONS ? pollOptions : [
          ...pollOptions,
          ...Array(MIN_OPTIONS - pollOptions.length).fill(null).map(() => ({
            id: generateOptionId(),
            title: '',
            description: '',
            imageUrl: '',
          })),
        ]);
      } else {
        // Creating new poll - reset form
        setTitle('');
        setDescription('');
        setIsActive(true);
        setOptions([
          { id: generateOptionId(), title: '', description: '', imageUrl: '' },
          { id: generateOptionId(), title: '', description: '', imageUrl: '' },
        ]);
      }
      setActiveOptionIndex(null);
    }
  }, [open, poll]);

  const handleAddOption = () => {
    if (options.length < MAX_OPTIONS) {
      setOptions([...options, { id: generateOptionId(), title: '', description: '', isActive: false, imageUrl: '' }]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > MIN_OPTIONS) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (activeOptionIndex === index) {
        setActiveOptionIndex(null);
      } else if (activeOptionIndex !== null && activeOptionIndex > index) {
        setActiveOptionIndex(activeOptionIndex - 1);
      }
    }
  };

  const handleOptionChange = (index: number, field: keyof PollOptionFormData, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleMediaSelect = (item: MediaItem, index: number) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      title: item.title,
      isActive: newOptions[index].isActive,
      imageUrl: item.imageUrl || '',
    };
    setOptions(newOptions);
    setActiveOptionIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validOptions = options.filter(opt => opt.title.trim());
    
    if (validOptions.length < MIN_OPTIONS) {
      setLoading(false);
      return;
    }

    const data: PollFormData = {
      title,
      description: description || undefined,
      isActive: isActive || false,
      options: validOptions,
    };

    const result = await onSubmit(data);
    
    if (result.success) {
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  const isEditing = !!poll;
  const canAddOption = options.length < MAX_OPTIONS;
  const canRemoveOption = options.length > MIN_OPTIONS;
  const validOptionsCount = options.filter(opt => opt.title.trim()).length;
  const isFormValid = title.trim() && validOptionsCount >= MIN_OPTIONS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] sm:max-h-[90vh] w-[95vw] sm:max-w-2xl overflow-y-auto pb-20 pt-10 sm:py-10">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Szavazás Szerkesztése' : 'Új Szavazás Létrehozása'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Módosítsd a szavazás adatait és opcióit.'
              : 'Hozz létre egy új szavazást 2-6 opcióval.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Poll Title */}
          <div className="space-y-2">
            <Label htmlFor="poll-title">Szavazás Címe *</Label>
            <Input
              id="poll-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="pl. Következő Kvízest Témája"
              required
            />
          </div>

          {/* Poll Description */}
          <div className="space-y-2">
            <Label htmlFor="poll-description">Leírás</Label>
            <Textarea
              id="poll-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rövid leírás a szavazásról..."
              rows={2}
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="poll-active">Aktív Szavazás</Label>
              <p className="text-xs text-muted-foreground">
                Az inaktív szavazások nem jelennek meg a nyilvános oldalon.
              </p>
            </div>
            <Switch
              id="poll-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          {/* Options Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Opciók ({validOptionsCount}/{MAX_OPTIONS})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                disabled={!canAddOption}
              >
                <Plus className="mr-1 size-4" />
                Opció Hozzáadása
              </Button>
            </div>

            <div className="space-y-3">
              {options.map((option, index) => (
                <div
                  key={option.id || index}
                  className="rounded-lg border bg-card p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Opció {index + 1}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                      disabled={!canRemoveOption}
                      className="size-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Opció törlése</span>
                    </Button>
                  </div>

                  {/* Media Search for this option */}
                  <div className="mb-3 space-y-2">
                    <Label className="text-xs">Media Keresése</Label>
                    <SearchAndSelect
                      onSelect={(item) => handleMediaSelect(item, index)}
                      selectedTitle={activeOptionIndex === index ? option.title : undefined}
                    />
                  </div>

                  {/* Option Preview & Details */}
                  <div className="flex gap-4">
                    {/* Image Preview */}
                    <div className="shrink-0">
                      {option.imageUrl ? (
                        <div className="relative size-16 overflow-hidden rounded-lg">
                          <Image
                            src={option.imageUrl}
                            alt={option.title || 'Option image'}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex size-16 items-center justify-center rounded-lg bg-muted">
                          <ImageIcon className="size-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Option Fields */}
                    <div className="flex-1 space-y-2">
                      <Input
                        value={option.title}
                        onChange={(e) => handleOptionChange(index, 'title', e.target.value)}
                        placeholder="Opció címe *"
                        required
                      />
                      <Input
                        value={option.description || ''}
                        onChange={(e) => handleOptionChange(index, 'description', e.target.value)}
                        placeholder="Rövid leírás (opcionális)"
                      />
                      <Input
                        type="url"
                        value={option.imageUrl || ''}
                        onChange={(e) => handleOptionChange(index, 'imageUrl', e.target.value)}
                        placeholder="Kép URL (opcionális)"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {validOptionsCount < MIN_OPTIONS && (
              <p className="text-sm text-destructive">
                Legalább {MIN_OPTIONS} opció szükséges a szavazás létrehozásához.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Mégse
            </Button>
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading ? 'Mentés...' : isEditing ? 'Mentés' : 'Létrehozás'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
