"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import {
  Plus,
  Trash2,
  MoreVertical,
  Vote,
  Pencil,
  RotateCcw,
  Power,
  PowerOff,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getVotingSessions,
  createVotingSession,
  updateVotingSession,
  deleteVotingSession,
  resetVotingSessionVotes,
  toggleVotingSessionActive,
} from "@/services/voting/voting-service";
import { triggerStorageRefresh } from "@/hooks/use-mock-data";
import { subscribeToStorage } from "@/services/mock-storage";
import type { VotingSession, VotingSessionFormData } from "@/types";
import { VotingSessionFormDialog } from "./voting-session-form-dialog";
import { ActiveVotingChart } from "./active-voting-chart";
import { Card, CardContent } from "@/components/ui/card";
import { useVotingSessions } from "@/hooks/use-voting-sessions";
import { useQueryClient } from "@tanstack/react-query";

export function AdminVotingTable() {
  const queryClient = useQueryClient();
  const { sessions, loading } = useVotingSessions(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<VotingSession | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleCreate = async (data: VotingSessionFormData) => {
    const result = await createVotingSession(data);
    if (result.success) {
      triggerStorageRefresh();

      await queryClient.invalidateQueries({ queryKey: ["voting_sessions"] });
    }
    return result;
  };

  const handleUpdate = async (data: VotingSessionFormData) => {
    if (!editingSession)
      return { success: false, error: "Nincs szerkesztendő szavazás" };

    const result = await updateVotingSession(editingSession.id, data);
    if (result.success) {
      triggerStorageRefresh();
      setEditingSession(null);

      await queryClient.invalidateQueries({ queryKey: ["voting_sessions"] });
    }
    return result;
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    const result = await deleteVotingSession(deleteId);

    if (result.success) {
      triggerStorageRefresh();

      await queryClient.invalidateQueries({ queryKey: ["voting_sessions"] });
    }

    setIsDeleting(false);
    setDeleteId(null);
  };

  const handleResetVotes = async () => {
    if (!resetId) return;

    setIsResetting(true);
    const result = await resetVotingSessionVotes(resetId);
    if (result.success) {
      triggerStorageRefresh();

      await queryClient.invalidateQueries({ queryKey: ["voting_sessions"] });
    }
    setIsResetting(false);
    setResetId(null);
  };

  const handleToggleActive = async (sessionId: string) => {
    const result = await toggleVotingSessionActive(sessionId);
    if (result.success) {
      triggerStorageRefresh();

      await queryClient.invalidateQueries({ queryKey: ["voting_sessions"] });
    }
  };

  const handleEdit = (session: VotingSession) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingSession(null);
    }
  };

  // Total votes across a session's votepool.
  const getTotalVotes = (session: VotingSession) => {
    return session.votepool.reduce((sum, topic) => sum + topic.votes, 0);
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
    <>
      <div className="mb-4 sm:mb-6">
        <ActiveVotingChart />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold sm:text-lg dark:text-card-foreground">
          <p>Szavazások Kezelése</p>
        </h2>
        <Button onClick={() => setIsFormOpen(true)} size="sm">
          <Plus data-icon="inline-start" />
          <p className="text-sm">Új Szavazás</p>
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-base">
              <p>Nincsenek szavazások. Hozd létre az elsőt!</p>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card
              key={session.id}
              className="relative overflow-hidden h-30 sm:h-34"
            >
              <CardContent className="py-2 px-4">
                <div className="flex flex-col flex-1">
                  <div className="flex flex-col flex-1 gap-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1 max-w-5/6">
                        <p className="flex-wrap font-medium text-base">
                          {session.title || "Névtelen szavazás"}
                        </p>
                        {session.description && (
                          <p className="flex-nowrap text-sm text-muted-foreground truncate">
                            {session.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="absolute flex items-center gap-2 sm:gap-4 text-muted-foreground text-xs sm:text-base bottom-3 left-3">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="size-4" />
                      {format(session.createdAt, "yyyy. MMM dd.", {
                        locale: hu,
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Vote className="size-4" />
                      {session.votepool.length} opció
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-foreground">
                        {getTotalVotes(session)}
                      </span>{" "}
                      szavazat
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-primary text-primary-foreground shadow-sm hover:bg-primary/70 transition-colors cursor-pointer">
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-38 sm:w-32 bg-primary text-primary-foreground"
                      >
                        <DropdownMenuItem
                          onClick={() => handleEdit(session)}
                          className="drop-down-menu-item"
                        >
                          <Pencil className="size-4" />
                          <p className="flex-1">Szerkesztés</p>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(session.id)}
                          className="drop-down-menu-item"
                        >
                          {session.isActive ? (
                            <PowerOff className="size-4" />
                          ) : (
                            <Power className="size-4" />
                          )}
                          <p className="flex-1">
                            {session.isActive ? "Deaktiválás" : "Aktiválás"}
                          </p>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setResetId(session.id)}
                          className="text-amber-600 drop-down-menu-item"
                        >
                          <RotateCcw className="size-4" />
                          <p className="flex-1">Szavazatok nullázása</p>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-primary-foreground/20" />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(session.id)}
                          className="text-destructive drop-down-menu-item font-medium"
                        >
                          <Trash2 className="size-4" />
                          <p className="flex-1">Törlés</p>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <Badge variant={session.isActive ? "default" : "secondary"}>
                      {session.isActive ? "Aktív" : "Inaktív"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <VotingSessionFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={editingSession ? handleUpdate : handleCreate}
        session={editingSession}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Szavazás törlése</DialogTitle>
            <DialogDescription className="text-sm text-primary font-medium py-4">
              Ez a művelet nem visszavonható. A szavazás és a szavazatok száma
              véglegesen törlődik.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
            >
              Mégse
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto text-primary-foreground hover:bg-destructive/80"
            >
              {isDeleting ? "Törlés..." : "Törlés"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Votes Confirmation Dialog */}
      <Dialog open={!!resetId} onOpenChange={() => setResetId(null)}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Szavazatok Nullázása</DialogTitle>
            <DialogDescription className="text-sm text-primary font-medium py-4">
              Ez a művelet az összes opció szavazatszámát nullára állítja. Ez a
              művelet nem visszavonható.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setResetId(null)}
              disabled={isResetting}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
            >
              Mégse
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetVotes}
              disabled={isResetting}
              className="bg-amber-500 text-primary-foreground hover:bg-amber-600"
            >
              {isResetting ? "Nullázás..." : "Nullázás"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
