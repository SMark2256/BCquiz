import { QuizList } from "@/components/features/quiz-list";
import { VotingWidget } from "@/components/features/voting-widget";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b-4 border-foreground bg-foreground py-6 text-background sm:py-8">
        <div className="mx-auto max-w-xl px-4 text-center">
          <h1 className="mb-2 text-4xl font-black uppercase tracking-tight sm:text-5xl md:text-6xl">
            KVIZESTEK
          </h1>
          <p className="text-base font-medium tracking-wide sm:text-lg">
            A BARCRAFT CORVINBAN
          </p>
        </div>
      </header>

      {/* Main Content - Single Column */}
      <div className="mx-auto max-w-xl px-3 py-6 sm:px-4 sm:py-8">
        {/* Upcoming Quizzes Section */}
        <section className="mb-8 sm:mb-10">
          <h2 className="mb-4 text-center text-lg font-bold uppercase tracking-tight sm:mb-6 sm:text-xl">
            Következő Kvízestek
          </h2>
          <QuizList />
        </section>

        {/* Divider */}
        <div className="mb-8 flex items-center gap-3 sm:mb-10 sm:gap-4">
          <div className="h-0.5 flex-1 bg-foreground" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground sm:text-sm">
            Szavazás
          </span>
          <div className="h-0.5 flex-1 bg-foreground" />
        </div>

        {/* Voting Section */}
        <section className="mb-8 sm:mb-10">
          <VotingWidget />
        </section>

        {/* Info Section */}
        <section className="rounded-lg border-2 border-foreground bg-foreground p-4 text-background sm:p-6">
          <div className="flex flex-col gap-3 text-center sm:gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-70">Helyszín</p>
              <p className="text-lg font-black tracking-tight sm:text-xl">BARCRAFT CORVIN</p>
            </div>
            <div className="h-px bg-background/20" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-70">Kezdés</p>
              <p className="text-lg font-black sm:text-xl">20:00</p>
            </div>
            <div className="h-px bg-background/20" />
            <div className="text-xs opacity-80 sm:text-sm">
              <p>A foglalás ajánlott.</p>
              <p>Jelentkezések alapján a nyeremény növekszik.</p>
              <p className="mt-2 text-xs">További kérdésekkel keresd a pultosokat!</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center sm:py-6">
        <p className="text-lg font-black uppercase tracking-tighter sm:text-xl">
          BARCRAFT <span className="text-muted-foreground">CORVIN</span>
        </p>
      </footer>
    </div>
  );
}
