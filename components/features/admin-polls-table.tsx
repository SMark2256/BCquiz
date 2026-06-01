'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Plus, Trash2, MoreVertical, Vote, Pencil, RotateCcw, Power, PowerOff } from 'lucide-react';
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
  DropdownMenuSeparator,
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
import { getPolls, createPoll, updatePoll, deletePoll, resetPollVotes, togglePollActive } from '@/services/poll-service';
import { triggerStorageRefresh } from '@/hooks/use-mock-data';
import type { Poll, PollFormData } from '@/types';
import { PollFormDialog } from './poll-form-dialog';

export function AdminPollsTable() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    const result = await getPolls();
    if (result.success && result.data) {
      setPolls(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleCreate = async (data: PollFormData) => {
    const result = await createPoll(data);
    if (result.success) {
      triggerStorageRefresh();
      fetchPolls();
    }
    return result;
  };

  const handleUpdate = async (data: PollFormData) => {
    if (!editingPoll) return { success: false, error: 'No poll to edit' };
    
    const result = await updatePoll(editingPoll.id, data);
    if (result.success) {
      triggerStorageRefresh();
      fetchPolls();
      setEditingPoll(null);
    }
    return result;
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    const result = await deletePoll(deleteId);
    if (result.success) {
      triggerStorageRefresh();
      fetchPolls();
    }
    setIsDeleting(false);
    setDeleteId(null);
  };

  const handleResetVotes = async () => {
    if (!resetId) return;
    
    setIsResetting(true);
    const result = await resetPollVotes(resetId);
    if (result.success) {
      triggerStorageRefresh();
      fetchPolls();
    }
    setIsResetting(false);
    setResetId(null);
  };

  const handleToggleActive = async (pollId: string) => {
    const result = await togglePollActive(pollId);
    if (result.success) {
      triggerStorageRefresh();
      fetchPolls();
    }
  };

  const handleEdit = (poll: Poll) => {
    setEditingPoll(poll);
    setIsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingPoll(null);
    }
  };

  // Calculate total votes for a poll
  const getTotalVotes = (poll: Poll) => {
    return Object.values(poll.options).reduce((sum, opt) => sum + opt.votes, 0);
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
          Új Szavazás
        </Button>
      </div>

      {polls.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
          <Vote className="mx-auto mb-4 size-12 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">Nincsenek szavazások</h3>
          <p className="mb-4 text-muted-foreground">
            Hozz létre új szavazásokat több opcióval, amikre a látogatók szavazhatnak.
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus data-icon="inline-start" />
            Első szavazás létrehozása
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cím</TableHead>
                <TableHead>Státusz</TableHead>
                <TableHead className="text-center">Opciók</TableHead>
                <TableHead className="text-center">Össz. Szavazat</TableHead>
                <TableHead className="text-right">Létrehozva</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {polls.map((poll) => (
                <TableRow key={poll.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{poll.title}</p>
                      {poll.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {poll.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={poll.isActive ? 'default' : 'secondary'}
                      className={poll.isActive ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                    >
                      {poll.isActive ? 'Aktív' : 'Inaktív'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{Object.keys(poll.options).length}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{getTotalVotes(poll)}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {format(poll.createdAt, 'MMM d.', { locale: hu })}
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
                        <DropdownMenuItem onClick={() => handleEdit(poll)}>
                          <Pencil data-icon="inline-start" />
                          Szerkesztés
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(poll.id)}>
                          {poll.isActive ? (
                            <>
                              <PowerOff data-icon="inline-start" />
                              Deaktiválás
                            </>
                          ) : (
                            <>
                              <Power data-icon="inline-start" />
                              Aktiválás
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setResetId(poll.id)}
                          className="text-amber-600 focus:text-amber-600"
                        >
                          <RotateCcw data-icon="inline-start" />
                          Szavazatok Nullázása
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(poll.id)}
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

      <PollFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={editingPoll ? handleUpdate : handleCreate}
        poll={editingPoll}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Biztosan törlöd?</AlertDialogTitle>
            <AlertDialogDescription>
              Ez a művelet nem visszavonható. A szavazás és az összes kapcsolódó adat véglegesen törlődik.
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

      {/* Reset Votes Confirmation Dialog */}
      <AlertDialog open={!!resetId} onOpenChange={() => setResetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Szavazatok Nullázása</AlertDialogTitle>
            <AlertDialogDescription>
              Ez a művelet az összes opció szavazatszámát nullára állítja. Ez a művelet nem visszavonható.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Mégse</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetVotes}
              disabled={isResetting}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              {isResetting ? 'Nullázás...' : 'Nullázás'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
