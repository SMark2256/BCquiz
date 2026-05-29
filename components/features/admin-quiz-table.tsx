'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Pencil, Trash2, Plus, MoreVertical, Calendar, Clock } from 'lucide-react';
import { useQuizzes } from '@/hooks/use-quizzes';
import { deleteQuiz } from '@/services/quiz-service';
import { triggerStorageRefresh } from '@/hooks/use-mock-data';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { QuizFormDialog } from './quiz-form-dialog';
import type { Quiz } from '@/types';

export function AdminQuizTable() {
  const { quizzes, loading, error, refetch } = useQuizzes(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState<Quiz | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingQuiz) return;
    
    setIsDeleting(true);
    const result = await deleteQuiz(deletingQuiz.id);
    setIsDeleting(false);
    
    if (result.success) {
      triggerStorageRefresh();
      setDeletingQuiz(null);
      refetch();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="mb-2 h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="size-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold sm:text-lg">Kvízek Kezelése</h2>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="text-xs sm:text-sm">
          <Plus data-icon="inline-start" />
          <span className="hidden xs:inline">Új Kvíz</span>
          <span className="xs:hidden">Új</span>
        </Button>
      </div>

      {/* Mobile: Card layout, Desktop: Could use table but cards work well too */}
      <div className="flex flex-col gap-2 sm:gap-3">
        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground sm:text-base">
              Nincsenek kvízek. Hozd létre az elsőt!
            </CardContent>
          </Card>
        ) : (
          quizzes.map((quiz) => (
            <Card key={quiz.id} className="overflow-hidden">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  {/* Quiz Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium sm:text-base">{quiz.title}</p>
                        {quiz.titleHu && (
                          <p className="truncate text-xs text-muted-foreground">{quiz.titleHu}</p>
                        )}
                      </div>
                      <Badge variant={quiz.isActive ? 'default' : 'secondary'} className="shrink-0 text-xs">
                        {quiz.isActive ? 'Aktív' : 'Inaktív'}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {format(quiz.date, 'MMM dd.', { locale: hu })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {quiz.time}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <MoreVertical className="size-4" />
                      <span className="sr-only">Műveletek</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => setEditingQuiz(quiz)}>
                          <Pencil className="size-4" />
                          Szerkesztés
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingQuiz(quiz)}
                          className="text-destructive"
                        >
                          <Trash2 className="size-4" />
                          Törlés
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <QuizFormDialog
        quiz={editingQuiz}
        open={isCreateOpen || !!editingQuiz}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingQuiz(null);
          }
        }}
        onSuccess={() => {
          setIsCreateOpen(false);
          setEditingQuiz(null);
          refetch();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingQuiz} onOpenChange={() => setDeletingQuiz(null)}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kvíz Törlése</DialogTitle>
            <DialogDescription className="text-sm">
              Biztosan törölni szeretnéd a(z) &quot;{deletingQuiz?.title}&quot; kvízt? Ez a művelet nem visszavonható.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setDeletingQuiz(null)} className="w-full sm:w-auto">
              Mégse
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="w-full sm:w-auto">
              {isDeleting ? 'Törlés...' : 'Törlés'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
