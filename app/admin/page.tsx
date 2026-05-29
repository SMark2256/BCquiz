import Link from "next/link";
import { AdminQuizTable } from "@/components/features/admin-quiz-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryProvider } from "@/components/providers/query-provider";
import { isFirebaseConfigured } from "@/lib/firebase";
import { AlertCircle, CalendarDays, Vote, ArrowLeft } from "lucide-react";

export default function AdminPage() {
  const firebaseConfigured = isFirebaseConfigured();

  return (
    <QueryProvider>
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
          <h1 className="text-lg font-bold">Admin Panel</h1>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Kvízestek Kezelése</h2>
          <p className="text-muted-foreground">
            Kvízek, események és szavazási témák kezelése.
          </p>
        </div>

        {!firebaseConfigured && (
          <Alert className="mb-6">
            <AlertCircle className="size-4" />
            <AlertDescription>
              A Firebase nincs konfigurálva. Demonstrációs adatokat használunk. Állítsd be a Firebase környezeti változókat a teljes funkcionalitáshoz.
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
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
              <Vote className="mx-auto mb-4 size-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">Szavazási Témák Kezelése</h3>
              <p className="text-muted-foreground">
                Hamarosan - kezeld a szavazási témákat a következő kvízestekhez.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </QueryProvider>
  );
}
