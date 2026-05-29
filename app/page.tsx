import { QuizList } from "@/components/features/quiz-list";
import { VotingWidget } from "@/components/features/voting-widget";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b-4 border-foreground bg-foreground py-8 text-background">
        <div className="mx-auto max-w-xl px-4 text-center">
          <h1 className="mb-2 text-5xl font-black uppercase tracking-tight sm:text-6xl">
            KVIZESTEK
          </h1>
          <p className="text-lg font-medium tracking-wide">
            A BARCRAFT CORVINBAN
          </p>
        </div>
      </header>

      {/* Main Content - Single Column */}
      <div className="mx-auto max-w-xl px-4 py-8">
        {/* Upcoming Quizzes Section */}
        <section className="mb-10">
          <h2 className="mb-6 text-center text-xl font-bold uppercase tracking-tight">
            Következő Kvízestek
          </h2>
          <QuizList />
        </section>

        {/* Divider */}
        <div className="mb-10 flex items-center gap-4">
          <div className="h-0.5 flex-1 bg-foreground" />
          <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Szavazás
          </span>
          <div className="h-0.5 flex-1 bg-foreground" />
        </div>

        {/* Voting Section */}
        <section className="mb-10">
          <VotingWidget />
        </section>

        {/* Info Section */}
        <section className="rounded-lg border-2 border-foreground bg-foreground p-6 text-background">
          <div className="flex flex-col gap-4 text-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-70">Helyszín</p>
              <p className="text-xl font-black tracking-tight">BARCRAFT CORVIN</p>
            </div>
            <div className="h-px bg-background/20" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-70">Kezdés</p>
              <p className="text-xl font-black">20:00</p>
            </div>
            <div className="h-px bg-background/20" />
            <div className="text-sm opacity-80">
              <p>A foglalás ajánlott.</p>
              <p>Jelentkezések alapján a nyeremény növekszik.</p>
              <p className="mt-2 text-xs">További kérdésekkel keresd a pultosokat!</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xl font-black uppercase tracking-tighter">
          BARCRAFT <span className="text-muted-foreground">CORVIN</span>
        </p>
      </footer>
    </div>
  );
}
