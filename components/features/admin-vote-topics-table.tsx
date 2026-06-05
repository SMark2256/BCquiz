'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Plus, Trash2, MoreVertical, ImageIcon, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getVoteTopics, createVoteTopic, deleteVoteTopic } from '@/services/vote-service';
import { triggerStorageRefresh } from '@/hooks/use-mock-data';
import type { VoteTopic, VoteTopicFormData } from '@/types';
import { VoteTopicFormDialog } from './vote-topic-form-dialog';

export function AdminVoteTopicsTable() {
  const [topics, setTopics] = useState<VoteTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<VoteTopic | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    const result = await getVoteTopics();
    if (result.success && result.data) {
      setTopics(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleCreate = async (data: VoteTopicFormData) => {
    const result = await createVoteTopic(data);
    if (result.success) {
      triggerStorageRefresh();
      fetchTopics();
      setIsFormOpen(false);
    }
    return result;
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    const result = await deleteVoteTopic(deleteId);
    if (result.success) {
      triggerStorageRefresh();
      fetchTopics();
    }
    setIsDeleting(false);
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="rounded-lg border">
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus data-icon="inline-start" />
          Új Téma
        </Button>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
          <Vote className="mx-auto mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">Nincsenek szavazási témák</h3>
          <p className="mb-4 text-muted-foreground">
            Hozz létre új témákat, amikre a látogatók szavazhatnak.
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus data-icon="inline-start" />
            Első téma létrehozása
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Kép</TableHead>
                <TableHead>Cím</TableHead>
                <TableHead>Leírás</TableHead>
                <TableHead className="text-center">Szavazatok</TableHead>
                <TableHead className="text-right">Létrehozva</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell>
                    {topic.imageUrl ? (
                      <div className="relative size-12 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={topic.imageUrl}
                          alt={topic.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
                        <ImageIcon className="size-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{topic.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {topic.description || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{topic.votes}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {format(topic.createdAt, 'MMM d.', { locale: hu })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <MoreVertical className="size-4" />
                        <span className="sr-only">Műveletek</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setDeleteId(topic.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 data-icon="inline-start" />
                          Törlés
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <VoteTopicFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreate}
        topic={editingTopic}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Biztosan törlöd?</AlertDialogTitle>
            <AlertDialogDescription>
              Ez a művelet nem visszavonható. A szavazási téma véglegesen törlődik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Mégse</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Törlés...' : 'Törlés'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
