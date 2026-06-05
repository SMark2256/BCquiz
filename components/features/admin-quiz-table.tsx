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
  const { quizzes, loading, error } = useQuizzes(false);
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
      setDeletingQuiz(null);
      // A useQuizzes hook a háttérben már megkapta a frissítést a Firebase-től.
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
          <span>Új Kvíz</span>
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
            <Card key={quiz.id} className="relative overflow-hidden h-30 sm:h-34">
              <CardContent className="py-2 px-4">
                <div className="flex items-start gap-3">
                  {/* Quiz Info */}
                  <div className="flex flex-col flex-1 gap-6">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1 max-w-5/6">
                        <p className="flex-wrap font-medium text-base">{quiz.title}</p>
                        {quiz.titleHu && (
                          <p className="flex-nowrap text-sm text-muted-foreground truncate">{quiz.titleHu}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:gap-4 text-muted-foreground text-xs sm:text-base absolute bottom-3 left-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-4" />
                        {format(quiz.date, 'MMM dd.', { locale: hu })}
                      </span>
                    <span className="flex items-center gap-1">
                        <Clock className="size-4" />
                      {quiz.time}
                      </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
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
                  <div className="absolute bottom-3 right-3">
                    <Badge variant={quiz.isActive ? 'default' : 'secondary'}>
                      {quiz.isActive ? 'Aktív' : 'Inaktív'}
                    </Badge>
                  </div>
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


