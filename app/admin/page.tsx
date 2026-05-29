import { AdminQuizTable } from "@/components/features/admin-quiz-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isFirebaseConfigured } from "@/lib/firebase";
import { AlertCircle, CalendarDays, Vote } from "lucide-react";

export default function AdminPage() {
  const firebaseConfigured = isFirebaseConfigured();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage quizzes, events, and voting topics.
        </p>
      </div>

      {!firebaseConfigured && (
        <Alert className="mb-6">
          <AlertCircle className="size-4" />
          <AlertDescription>
            Firebase is not configured. Using mock data for demonstration. Set up your Firebase environment variables to enable full functionality.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="quizzes">
        <TabsList className="mb-6">
          <TabsTrigger value="quizzes" className="flex items-center gap-2">
            <CalendarDays className="size-4" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="voting" className="flex items-center gap-2">
            <Vote className="size-4" />
            Voting Topics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes">
          <AdminQuizTable />
        </TabsContent>

        <TabsContent value="voting">
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
            <Vote className="mx-auto mb-4 size-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">Voting Topics Management</h3>
            <p className="text-muted-foreground">
              Coming soon - manage voting topics for upcoming quiz nights.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
