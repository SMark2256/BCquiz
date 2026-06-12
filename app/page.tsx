import { QuizList } from "@/components/features/quiz-list";
import { VotingWidget } from "@/components/features/voting-widget";
import Image from "next/image";
import { Divider } from "@/components/ui/divider";
import MythicText from "@/components/ui/mythic-text";
import MythicIcon from "@/components/ui/mythic-icon";
import { FadeIn, BlurIn } from "@/components/ui/motion";
import MainLogo from "@/components/features/main-logo";
import AddressLink from "@/components/ui/address-link";

export default function Home() {
  return (
    <div className="bc-public-locked min-h-screen bg-transparent">
      {/* Hero Section */}
      <header className="flex items-center justify-center bg-foreground/0 text-background pt-4 mt-4 sm:mt-8 h-40 sm:h-48">
        <div className="mx-auto max-w-xl px-4 text-center">
          <div className="relative w-auto">
            <MainLogo />
          </div>

          {/*<p className="text-base font-medium tracking-wide sm:text-lg">*/}
          {/*  A BARCRAFT CORVINBAN*/}
          {/*</p>*/}
        </div>
      </header>

      {/* Main Content - Single Column */}
      <div className="mx-auto max-w-xl p-4">
        {/* Divider */}
        <h3 className="my-8 text-4xl sm:text-5xl text-muted text-center font-black uppercase tracking-normal">
          Kvízestek
        </h3>
        <Divider text="Következő Kvízestek" />

        <section className="mb-8 sm:mb-10">
          <QuizList />
        </section>

        {/* Divider */}
        <Divider text="Szavazás" />

        {/* Voting Section */}
        <FadeIn whileInView direction="up" className="mb-8 sm:mb-10">
          <section>
            <VotingWidget />
          </section>
        </FadeIn>

        {/* Info Section */}
        <BlurIn whileInView>
          <section className="rounded-lg border-2 border-white/10 bg-foreground p-4 text-background sm:p-6">
            <div className="flex flex-col gap-3 text-center sm:gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider opacity-70">
                  Helyszín
                </p>
                <AddressLink address="1092 Budapest, Ferenc Körút 34" />
              </div>
              <div className="h-px bg-background/20" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider opacity-70">
                  Kezdés
                </p>
                <MythicText>
                  <p className="text-lg font-black sm:text-xl">20:00</p>
                </MythicText>
              </div>
              <div className="h-px bg-background/20" />
              <div className="flex flex-col w-full text-xs sm:text-sm gap-1">
                <div className="flex items-center justify-center gap-4 h-14">
                  <MythicIcon>
                    <Image
                      src="/glass_svg.svg"
                      alt="potion icon"
                      width={80}
                      height={80}
                      className="object-contain max-h-20 p-2"
                      style={{ height: "auto" }}
                    />
                  </MythicIcon>
                  <div className="flex flex-1">
                    <p className="flex items-center  text-white font-normal text-base md:text-base">
                      A foglalás ajánlott.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 h-14">
                  <MythicIcon>
                    <Image
                      src="/chest_svg.svg"
                      alt="chest icon"
                      width={80}
                      height={80}
                      className="object-contain p-2"
                      style={{ height: "auto" }}
                    />
                  </MythicIcon>
                  <div className="flex flex-1">
                    <p className="flex items-center  text-white text-start font-normal text-base md:text-base">
                      Jelentkezések alapján a nyeremény növekszik.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 h-14">
                  <MythicIcon>
                    <Image
                      src="/question_svg.svg"
                      alt="question icon"
                      width={80}
                      height={80}
                      className="w-20 h-auto object-contain"
                    />
                  </MythicIcon>
                  <div className="flex flex-1">
                    <p className="flex items-center text-white text-start font-black text-base md:text-base">
                      További kérdésekkel keresd a pultosokat!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </BlurIn>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center sm:py-6">
        {/*<p className="text-lg text-white font-black uppercase tracking-tighter sm:text-xl">*/}
        {/*    BARCRAFT <span className="text-muted-foreground">CORVIN</span>*/}
        {/*</p>*/}
        <p className="text-xs text-muted/60 leading-3.5 text-center tracking-wide">
          © 2026 BarCraft Budapest. Minden jog fenntartva.
        </p>
      </footer>
    </div>
  );
}
