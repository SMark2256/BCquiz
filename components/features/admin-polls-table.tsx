'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Plus, Trash2, MoreVertical, Vote, Pencil, RotateCcw, Power, PowerOff, CalendarIcon } from 'lucide-react';
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
import {
    getPolls,
    createPoll,
    updatePoll,
    deletePoll,
    resetPollVotes,
    togglePollActive
} from '@/services/poll-service';
import { triggerStorageRefresh } from '@/hooks/use-mock-data';
import type { Poll, PollFormData } from '@/types';
import { PollFormDialog } from './poll-form-dialog';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

export function AdminPollsTable() {
    const [ polls, setPolls ] = useState<Poll[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ isFormOpen, setIsFormOpen ] = useState(false);
    const [ editingPoll, setEditingPoll ] = useState<Poll | null>(null);
    const [ deleteId, setDeleteId ] = useState<string | null>(null);
    const [ resetId, setResetId ] = useState<string | null>(null);
    const [ isDeleting, setIsDeleting ] = useState(false);
    const [ isResetting, setIsResetting ] = useState(false);

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
    }, [ fetchPolls ]);

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
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold sm:text-lg">Szavazások Kezelése</h2>
                <Button onClick={ () => setIsFormOpen(true) } size="sm">
                    <Plus data-icon="inline-start"/>
                    Új Szavazás
                </Button>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3">
                { polls.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground text-base">
                            Nincsenek szavazások. Hozd létre az elsőt!
                        </CardContent>
                    </Card>
                ) : (
                    polls.map((poll) => (
                        <Card key={ poll.id } className="overflow-hidden">
                            <CardContent className="py-2 px-4">
                                <div className="flex items-start gap-3 relative">
                                    <div className="flex flex-col flex-1 gap-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1 max-w-5/6">
                                                <p className="flex-wrap font-medium text-base">{ poll.title }</p>
                                                { poll.description && (
                                                    <p className="flex-wrap text-sm text-muted-foreground">{ poll.description }</p>
                                                ) }
                                            </div>
                                        </div>
                                        <div
                                            className="flex items-center gap-2 sm:gap-4 text-muted-foreground text-xs sm:text-base">
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon className="size-4"/>
                                                { format(poll.createdAt, 'yyyy. MMM dd.', { locale: hu }) }
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Vote className="size-4"/>
                                                { Object.keys(poll.options).length } opció
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span
                                                    className="font-semibold text-foreground">{ getTotalVotes(poll) }
                                                </span> szavazat
                                            </span>
                                        </div>
                                    </div>

                                    <div className="absolute -top-2 right-0">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                                            >
                                                <MoreVertical className="size-4"/>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={ () => handleEdit(poll) }>
                                                    <Pencil className="size-4"/> Szerkesztés
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={ () => handleToggleActive(poll.id) }>
                                                    { poll.isActive ? <PowerOff className="size-4"/> :
                                                        <Power className="size-4"/> }
                                                    { poll.isActive ? 'Deaktiválás' : 'Aktiválás' }
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={ () => setResetId(poll.id) }
                                                                  className="text-amber-600">
                                                    <RotateCcw className="size-4"/> Szavazatok nullázása
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator/>
                                                <DropdownMenuItem onClick={ () => setDeleteId(poll.id) }
                                                                  className="text-destructive">
                                                    <Trash2 className="size-4"/> Törlés
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="absolute bottom-0 right-0">
                                        <Badge variant={ poll.isActive ? 'default' : 'secondary' }>
                                            { poll.isActive ? 'Aktív' : 'Inaktív' }
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) }
            </div>

            <PollFormDialog
                open={ isFormOpen }
                onOpenChange={ handleFormClose }
                onSubmit={ editingPoll ? handleUpdate : handleCreate }
                poll={ editingPoll }
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
