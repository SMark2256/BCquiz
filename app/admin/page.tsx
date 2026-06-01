'use client';

import Link from "next/link";
import { AdminQuizTable } from "@/components/features/admin-quiz-table";
import { AdminPollsTable } from "@/components/features/admin-polls-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryProvider } from "@/components/providers/query-provider";
import { useMockStatus } from "@/hooks/use-mock-data";
import { isFirebaseConfigured } from "@/lib/firebase";
import { AlertCircle, CalendarDays, Vote, ArrowLeft, Database, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function AdminContent() {
    const { isMockMode, resetData } = useMockStatus();
    const firebaseConfigured = isFirebaseConfigured();
    const usingMockStorage = isMockMode || !firebaseConfigured;

    return (
        <div className="min-h-screen bg-background">
            {/* Admin Header */ }
            <header className="border-b border-border bg-secondary/30">
                <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-3 sm:h-14 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground sm:gap-2 sm:text-sm"
                        >
                            <ArrowLeft className="size-3 sm:size-4"/>
                            <span className="hidden xs:inline">Vissza a főoldalra</span>
                            <span className="xs:hidden">Vissza</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        { usingMockStorage && (
                            <Badge variant="outline"
                                   className="gap-1 border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-600 sm:gap-1.5 sm:px-2">
                                <Database className="size-3"/>
                                <span className="hidden sm:inline">Helyi tárolás</span>
                            </Badge>
                        ) }
                        <h1 className="text-sm font-bold sm:text-lg">Admin</h1>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
                <div className="mb-4 sm:mb-8">
                    <h2 className="text-xl font-bold tracking-tight sm:text-3xl">Kvízestek Kezelése</h2>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Kvízek, események és szavazási témák kezelése.
                    </p>
                </div>

                { usingMockStorage && (
                    <Alert className="flex mb-4 border-amber-500/50 bg-amber-500/10 sm:mb-6">
                        <AlertCircle className="flex my-auto size-5 text-amber-600"/>
                        <AlertDescription className="flex flex-row flex-1 gap-2 items-center justify-around">
              <span className=" text-md sm:text-sm">
                <strong>Helyi tárolás mód:</strong>{ ' ' }
                  <span className="hidden sm:inline">Az adatok a böngésző localStorage-jában tárolódnak.</span>
                <span className="sm:hidden">Adatok a böngészőben.</span>
                  { !firebaseConfigured && <span className="hidden sm:inline"> A Firebase nincs konfigurálva.</span> }
              </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={ resetData }
                                className="w-fit shrink-0 text-md sm:text-xs sm:ml-4"
                            >
                                <RotateCcw data-icon="inline-start"/>
                                <span className="hidden sm:inline">Alapértelmezett adatok</span>
                                <span className="sm:hidden">Reset</span>
                            </Button>
                        </AlertDescription>
                    </Alert>
                ) }

                <Tabs defaultValue="quizzes">
                    <TabsList className="mb-4 w-full sm:mb-6 sm:w-auto">
                        <TabsTrigger
                            value="quizzes"
                            className="flex flex-1 items-center justify-center gap-2 py-3 text-base sm:flex-initial sm:py-1.5"
                        >
                            <CalendarDays className="size-5 sm:size-4"/>
                            <span>Kvízek</span>
                        </TabsTrigger>
                        <TabsTrigger value="voting"
                                     className="flex flex-1 items-center gap-1.5 text-md sm:flex-initial sm:gap-2 sm:text-sm">
                            <Vote className="size-5 sm:size-4"/>
                            <span className="hidden xs:inline">Szavazási Témák</span>
                            <span className="xs:hidden">Szavazás</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="quizzes">
                        <AdminQuizTable/>
                    </TabsContent>

                    <TabsContent value="voting">
                        <AdminPollsTable/>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <QueryProvider>
            <AdminContent/>
        </QueryProvider>
    );
}
