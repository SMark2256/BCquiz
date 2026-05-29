'use client';

import Link from "next/link";
import { AdminQuizTable } from "@/components/features/admin-quiz-table";
import { AdminVoteTopicsTable } from "@/components/features/admin-vote-topics-table";
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
      {/* Admin Header */}
      <header className="border-b border-border bg-secondary/30">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Vissza a főoldalra
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {usingMockStorage && (
              <Badge variant="outline" className="gap-1.5 border-amber-500/50 bg-amber-500/10 text-amber-600">
                <Database className="size-3" />
                Helyi tárolás
              </Badge>
            )}
            <h1 className="text-lg font-bold">Admin Panel</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Kvízestek Kezelése</h2>
          <p className="text-muted-foreground">
            Kvízek, események és szavazási témák kezelése.
          </p>
        </div>

        {usingMockStorage && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="size-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>Helyi tárolás mód:</strong> Az adatok a böngésző localStorage-jában tárolódnak. 
                {!firebaseConfigured && ' A Firebase nincs konfigurálva.'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={resetData}
                className="ml-4 shrink-0"
              >
                <RotateCcw data-icon="inline-start" />
                Alapértelmezett adatok
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="quizzes">
          <TabsList className="mb-6">
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              Kvízek
            </TabsTrigger>
            <TabsTrigger value="voting" className="flex items-center gap-2">
              <Vote className="size-4" />
              Szavazási Témák
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quizzes">
            <AdminQuizTable />
          </TabsContent>

          <TabsContent value="voting">
            <AdminVoteTopicsTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <QueryProvider>
      <AdminContent />
    </QueryProvider>
  );
}
