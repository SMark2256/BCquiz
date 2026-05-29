'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, Plus, MoreVertical, Calendar, Clock } from 'lucide-react';
import { useQuizzes } from '@/hooks/use-quizzes';
import { deleteQuiz } from '@/services/quiz-service';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
      setDeletingQuiz(null);
      refetch();
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(4)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="size-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
        <h2 className="text-lg font-semibold">Manage Quizzes</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus data-icon="inline-start" />
          Add Quiz
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No quizzes found. Create your first quiz!
                </TableCell>
              </TableRow>
            ) : (
              quizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      {quiz.titleHu && (
                        <p className="text-xs text-muted-foreground">{quiz.titleHu}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm">
                      <Calendar className="size-3" />
                      {format(quiz.date, 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm">
                      <Clock className="size-3" />
                      {quiz.time}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={quiz.isActive ? 'default' : 'secondary'}>
                      {quiz.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <MoreVertical className="size-4" />
                        <span className="sr-only">Actions</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => setEditingQuiz(quiz)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingQuiz(quiz)}
                            className="text-destructive"
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingQuiz?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingQuiz(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
