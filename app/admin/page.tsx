"use client";

import Link from "next/link";
import { AdminQuizTable } from "@/components/features/admin-quiz-table";
import { AdminVotingTable } from "@/components/features/admin-voting-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryProvider } from "@/components/providers/query-provider";
import { AdminThemeProvider } from "@/components/providers/admin-theme-provider";
import { AdminThemeToggle } from "@/components/features/admin-theme-toggle";
import { useMockStatus } from "@/hooks/use-mock-data";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  AlertCircle,
  CalendarDays,
  Vote,
  ArrowLeft,
  Database,
  RotateCcw,
  Loader2,
  ShieldAlert,
  LogIn,
  LogOut,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { QrGenerator } from "@/components/features/qr-generator";
import { FadeIn, ScaleIn, BlurIn } from "@/components/ui/motion";

function AdminContent() {
  const { isAdmin, loading, login, logout } = useAuth();
  const { isMockMode, resetData } = useMockStatus();
  const firebaseConfigured = isFirebaseConfigured();
  const usingMockStorage = isMockMode || !firebaseConfigured;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <ScaleIn className="flex flex-col items-center">
          <div className="mb-6 rounded-full bg-primary/10 p-6">
            <ShieldAlert className="size-12 text-primary" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Adminisztrációs Felület</h1>
          <p className="mb-8 max-w-sm text-muted-foreground">
            A tartalom eléréséhez be kell jelentkezned egy engedélyezett Google
            fiókkal.
          </p>
          <Button onClick={login} size="lg" className="gap-2">
            <LogIn className="size-5" />
            Bejelentkezés Google fiókkal
          </Button>
        </ScaleIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b border-border bg-secondary/30">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:h-16 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground sm:gap-2 sm:text-sm"
            >
              <ArrowLeft className="size-4 scale-120" />
              <span className="hidden text-base xs:inline">
                Vissza a főoldalra
              </span>
              <span className="text-base xs:hidden">Vissza</span>
            </Link>
          </div>
          <div className="flex flex-1 justify-center items-center gap-2 sm:gap-3">
            {usingMockStorage ? (
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-600 sm:gap-1.5 sm:px-2"
              >
                <Database className="size-3" />
                <span className="hidden sm:inline">Helyi tárolás</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-600 sm:gap-1.5 sm:px-2"
              >
                <Database className="size-5 sm:size-4" />
                <span className="hidden sm:inline">Felhő tárolás</span>
              </Badge>
            )}
            <h1 className="text-card-foreground text-base font-bold sm:text-lg">
              Admin
            </h1>
            <AdminThemeToggle />
          </div>
          <div className="flex items-center gap-2 h-full sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="size-10 p-0 text-muted-foreground hover:text-destructive"
              title="Kijelentkezés"
            >
              <LogOut className="size-6 scale-120" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
        <FadeIn direction="up" className="mb-4 sm:mb-8">
          <h2 className="text-xl font-bold tracking-tight sm:text-3xl dark:text-card-foreground">
            Kvízestek Kezelése
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Kvízek, események és szavazási témák kezelése.
          </p>
        </FadeIn>

        {usingMockStorage && (
          <Alert className="flex mb-4 border-amber-500/50 bg-amber-500/10 sm:mb-6">
            <AlertCircle className="flex my-auto size-5 text-amber-600" />
            <AlertDescription className="flex flex-row flex-1 gap-2 items-center justify-around">
              <span className=" text-md sm:text-sm">
                <strong>Helyi tárolás mód:</strong>{" "}
                <span className="hidden sm:inline">
                  Az adatok a böngésző localStorage-jában tárolódnak.
                </span>
                <span className="sm:hidden">Adatok a böngészőben.</span>
                {!firebaseConfigured && (
                  <span className="hidden sm:inline">
                    {" "}
                    A Firebase nincs konfigurálva.
                  </span>
                )}
              </span>
              <Button
                size="sm"
                onClick={resetData}
                className="w-fit shrink-0 text-md sm:text-xs sm:ml-4"
              >
                <RotateCcw data-icon="inline-start" />
                <span className="hidden sm:inline">Alapértelmezett adatok</span>
                <span className="sm:hidden">Reset</span>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="quizzes">
          <TabsList className="mb-10 w-full sm:mb-10 sm:w-auto dark:bg-secondary/60">
            <TabsTrigger
              value="quizzes"
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 py-6 sm:py-6 text-base sm:flex-initial dark:text-muted-foreground dark:hover:text-foreground dark:data-active:bg-secondary dark:data-active:text-secondary-foreground dark:data-active:border-border"
            >
              <CalendarDays className="size-7 sm:size-4" />
              <span className="hidden sm:flex">Kvízek</span>
            </TabsTrigger>
            <TabsTrigger
              value="voting"
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 py-6 sm:py-6 text-base sm:flex-initial dark:text-muted-foreground dark:hover:text-foreground dark:data-active:bg-secondary dark:data-active:text-secondary-foreground dark:data-active:border-border"
            >
              <Vote className="size-7 sm:size-4 scale-110" />
              <span className="hidden sm:flex">Szavazási Témák</span>
            </TabsTrigger>
            <TabsTrigger
              value="tools"
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 py-6 sm:py-6 text-base sm:flex-initial dark:text-muted-foreground dark:hover:text-foreground dark:data-active:bg-secondary dark:data-active:text-secondary-foreground dark:data-active:border-border"
            >
              <QrCode className="size-7 sm:size-4" />
              <span className="hidden sm:flex">Eszközök</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quizzes">
            <BlurIn>
              <AdminQuizTable />
            </BlurIn>
          </TabsContent>

          <TabsContent value="voting">
            <BlurIn>
              <AdminVotingTable />
            </BlurIn>
          </TabsContent>

          <TabsContent value="tools">
            <BlurIn>
              <QrGenerator />
            </BlurIn>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <QueryProvider>
      <AdminThemeProvider>
        <AdminContent />
      </AdminThemeProvider>
    </QueryProvider>
  );
}
