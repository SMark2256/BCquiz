'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Plus, Trash2, MoreVertical, Vote, Pencil, RotateCcw, Power, PowerOff, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
    getVotingSessions,
    createVotingSession,
    updateVotingSession,
    deleteVotingSession,
    resetVotingSessionVotes,
    toggleVotingSessionActive,
} from '@/services/voting-service';
import { triggerStorageRefresh } from '@/hooks/use-mock-data';
import { subscribeToStorage } from '@/services/mock-storage';
import type { VotingSession, VotingSessionFormData } from '@/types';
import { VotingSessionFormDialog } from './voting-session-form-dialog';
// import { ActiveVotingChart } from './active-voting-chart';
import { Card, CardContent } from "@/components/ui/card";

export function AdminVotingTable() {
    const [ sessions, setSessions ] = useState<VotingSession[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ isFormOpen, setIsFormOpen ] = useState(false);
    const [ editingSession, setEditingSession ] = useState<VotingSession | null>(null);
    const [ deleteId, setDeleteId ] = useState<string | null>(null);
    const [ resetId, setResetId ] = useState<string | null>(null);
    const [ isDeleting, setIsDeleting ] = useState(false);
    const [ isResetting, setIsResetting ] = useState(false);

    const fetchSessions = useCallback(async (options?: { silent?: boolean }) => {
        if (!options?.silent) setLoading(true);
        const result = await getVotingSessions();
        if (result.success && result.data) {
            setSessions(result.data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSessions();
        // Keep the list in sync with any external storage change
        // (e.g. the "Alapértelmezett adatok" reset), so the table and the
        // live chart never disagree about which session is active.
        const unsubscribe = subscribeToStorage(() => {
            fetchSessions({ silent: true });
        });
        return () => {
            unsubscribe();
        };
    }, [ fetchSessions ]);

    const handleCreate = async (data: VotingSessionFormData) => {
        const result = await createVotingSession(data);
        if (result.success) {
            triggerStorageRefresh();
            fetchSessions();
        }
        return result;
    };

    const handleUpdate = async (data: VotingSessionFormData) => {
        if (!editingSession) return { success: false, error: 'Nincs szerkesztendő szavazás' };

        const result = await updateVotingSession(editingSession.id, data);
        if (result.success) {
            triggerStorageRefresh();
            setEditingSession(null);
            // Re-fetch so the edited session is reflected immediately in the list.
            fetchSessions();
        }
        return result;
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        setIsDeleting(true);
        const result = await deleteVotingSession(deleteId);
        if (result.success) {
            triggerStorageRefresh();
            fetchSessions();
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
            fetchSessions();
        }
        setIsResetting(false);
        setResetId(null);
    };

    const handleToggleActive = async (sessionId: string) => {
        const result = await toggleVotingSessionActive(sessionId);
        if (result.success) {
            triggerStorageRefresh();
            fetchSessions();
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
                    <Skeleton className="h-9 w-32"/>
                </div>
                <div className="rounded-lg border">
                    <div className="p-4 space-y-4">
                        { [ 1, 2, 3 ].map((i) => (
                            <Skeleton key={ i } className="h-16 w-full"/>
                        )) }
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/*<div className="mb-4 sm:mb-6">*/}
            {/*    <ActiveVotingChart/>*/}
            {/*</div>*/}

            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold sm:text-lg dark:text-muted-foreground">Szavazások Kezelése</h2>
                <Button onClick={ () => setIsFormOpen(true) } size="sm">
                    <Plus data-icon="inline-start"/>
                    Új Szavazás
                </Button>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3">
                { sessions.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground text-base">
                            Nincsenek szavazások. Hozd létre az elsőt!
                        </CardContent>
                    </Card>
                ) : (
                    sessions.map((session) => (
                        <Card key={ session.id } className="relative overflow-hidden h-30 sm:h-34">
                            <CardContent className="py-2 px-4">
                                <div className="flex flex-col flex-1">
                                    <div className="flex flex-col flex-1 gap-4">
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1 max-w-5/6">
                                                <p className="flex-wrap font-medium text-base">{ session.title || 'Névtelen szavazás' }</p>
                                                { session.description && (
                                                    <p className="flex-nowrap text-sm text-muted-foreground truncate">{ session.description }</p>
                                                ) }
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="absolute flex items-center gap-2 sm:gap-4 text-muted-foreground text-xs sm:text-base bottom-3 left-3">
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon className="size-4"/>
                                                { format(session.createdAt, 'yyyy. MMM dd.', { locale: hu }) }
                                            </span>
                                        <span className="flex items-center gap-1">
                                                <Vote className="size-4"/>
                                            { session.votepool.length } opció
                                            </span>
                                        <span className="flex items-center gap-1">
                                                <span
                                                    className="font-semibold text-foreground">{ getTotalVotes(session) }
                                                </span> szavazat
                                            </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                            >
                                                <MoreVertical className="size-4"/>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-38 sm:w-32">
                                                <DropdownMenuItem onClick={ () => handleEdit(session) }
                                                                  className="drop-down-menu-item">
                                                    <Pencil className="size-4"/>
                                                    <p className="flex-1">
                                                        Szerkesztés
                                                    </p>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={ () => handleToggleActive(session.id) }
                                                                  className="drop-down-menu-item">
                                                    { session.isActive ? <PowerOff className="size-4"/> :
                                                        <Power className="size-4"/> }
                                                    <p className="flex-1">
                                                        { session.isActive ? 'Deaktiválás' : 'Aktiválás' }
                                                    </p>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={ () => setResetId(session.id) }
                                                                  className="text-amber-600 drop-down-menu-item">
                                                    <RotateCcw className="size-4"/>
                                                    <p className="flex-1">Szavazatok nullázása</p>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator/>
                                                <DropdownMenuItem onClick={ () => setDeleteId(session.id) }
                                                                  className="text-destructive drop-down-menu-item">
                                                    <Trash2 className="size-4"/>
                                                    <p className="flex-1">Törlés</p>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="absolute bottom-3 right-3">
                                        <Badge variant={ session.isActive ? 'default' : 'secondary' }>
                                            { session.isActive ? 'Aktív' : 'Inaktív' }
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) }
            </div>

            <VotingSessionFormDialog
                open={ isFormOpen }
                onOpenChange={ handleFormClose }
                onSubmit={ editingSession ? handleUpdate : handleCreate }
                session={ editingSession }
            />

            {/* Delete Confirmation Dialog */ }
            <AlertDialog open={ !!deleteId } onOpenChange={ () => setDeleteId(null) }>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Biztosan törlöd?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ez a művelet nem visszavonható. A szavazás és az összes kapcsolódó adat véglegesen törlődik.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={ isDeleting }>Mégse</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={ handleDelete }
                            disabled={ isDeleting }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            { isDeleting ? 'Törlés...' : 'Törlés' }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reset Votes Confirmation Dialog */ }
            <AlertDialog open={ !!resetId } onOpenChange={ () => setResetId(null) }>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Szavazatok Nullázása</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ez a művelet az összes opció szavazatszámát nullára állítja. Ez a művelet nem visszavonható.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={ isResetting }>Mégse</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={ handleResetVotes }
                            disabled={ isResetting }
                            className="bg-amber-500 text-white hover:bg-amber-600"
                        >
                            { isResetting ? 'Nullázás...' : 'Nullázás' }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
