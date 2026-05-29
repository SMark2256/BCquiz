import { QuizList } from "@/components/features/quiz-list";
import { VotingWidget } from "@/components/features/voting-widget";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="mb-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">
          KVIZESTEK
        </h1>
        <p className="text-lg text-muted-foreground">
          A BarCraft Corvinban
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Upcoming Quizzes */}
        <section className="lg:col-span-3">
          <h2 className="mb-4 text-xl font-bold uppercase tracking-tight">
            Upcoming Quiz Nights
          </h2>
          <QuizList />
        </section>

        {/* Voting Section */}
        <section className="lg:col-span-2">
          <VotingWidget />
        </section>
      </div>

      {/* Info Section */}
      <section className="mt-12 rounded-lg border-2 border-foreground bg-foreground p-6 text-background">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium uppercase opacity-80">Location</p>
            <p className="text-lg font-bold">BarCraft Corvin</p>
          </div>
          <div>
            <p className="text-sm font-medium uppercase opacity-80">Start Time</p>
            <p className="text-lg font-bold">20:00</p>
          </div>
          <div>
            <p className="text-sm font-medium uppercase opacity-80">Note</p>
            <p className="text-sm opacity-80">
              A foglalás ajánlott. Jelentkezések alapján a nyeremény növekszik.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
