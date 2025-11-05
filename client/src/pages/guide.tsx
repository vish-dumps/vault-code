import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Compass, Layers, CalendarCheck, BookmarkCheck, Zap, Rocket, ListChecks, Target, Search } from "lucide-react";

type IconType = typeof Compass;

interface JourneyPhase {
  label: string;
  title: string;
  description: string;
  highlights: string[];
  icon: IconType;
  accent: string;
}

interface Scenario {
  title: string;
  description: string;
  icon: IconType;
  cta: string;
  destination: string;
}

const journeyPhases: JourneyPhase[] = [
  {
    label: "What Is CodeVault?",
    title: "Your Personal Coding Companion",
    description:
      "CodeVault is an app + Chrome extension that automatically tracks your solved coding problems from platforms like LeetCode, Codeforces, and Atcoder, and saves them to your GitHub repository.",
    highlights: [
      "Automatically detects solved problems and saves the code, problem name, difficulty, platform link, and date solved.",
      "View everything on your CodeVault dashboard — neatly organized by topic, difficulty, and time.",
      "Build a portfolio of growth — showing how far you've come, what you've learned, and what challenges you've mastered.",
    ],
    icon: Layers,
    accent: "from-purple-500/70 via-fuchsia-500/40 to-sky-500/40",
  },
  {
    label: "How It Works",
    title: "Seamless Auto-Tracking",
    description:
      "Install the Chrome Extension, log in to your CodeVault account, and solve problems normally on LeetCode or Codeforces. CodeVault does the rest!",
    highlights: [
      "The extension runs quietly in the background and detects when you click 'Submit' or 'Run'.",
      "It waits for the final verdict (Accepted, Wrong Answer, etc.) — even if the platform queues submissions like Codeforces.",
      "Then sends the result and code to your Vault automatically.",
      "Pro Tip: Even if Codeforces takes time to judge your submission, CodeVault checks periodically until your result arrives.",
    ],
    icon: Compass,
    accent: "from-amber-400/70 via-orange-400/40 to-rose-400/40",
  },
  {
    label: "Get the Most Out of CodeVault",
    title: "Pro Tips for Maximum Value",
    description:
      "Build your Vault, track progress, sync with GitHub, and engage with the community to maximize your coding journey.",
    highlights: [
      "Build Your 'Vault' — Think of it like your coding resume. Each problem you solve adds to your vault and XP.",
      "Tag & Filter — Use tags like 'Dynamic Programming' or 'Arrays' to organize your practice topics.",
      "Track Progress — Use the XP and stats system to see how consistent you are.",
      "Sync with GitHub — Every submission automatically uploads, showing your coding streak to potential recruiters.",
      "Review Later — Revisit older problems, see your code history, and compare with newer attempts.",
    ],
    icon: Rocket,
    accent: "from-emerald-400/70 via-teal-400/40 to-cyan-400/40",
  },
];

const scenarios: Scenario[] = [
  {
    title: "The Extension — Your Hidden Superpower",
    description:
      "The Chrome extension makes CodeVault feel magical. It detects when you submit on coding platforms, waits for the verdict, and automatically saves your solution to your Vault.",
    cta: "View Dashboard",
    destination: "/",
    icon: CalendarCheck,
  },
  {
    title: "Friends, Fun, and the Social Side",
    description:
      "CodeVault isn't just a tracker — it's also about community. Add friends, compete for XP, discuss problems, and showcase achievements. Share your public vault link on LinkedIn or GitHub!",
    cta: "View Friends",
    destination: "/community/friends",
    icon: Search,
  },
  {
    title: "Track Your Journey",
    description:
      "Use the dashboard to view your streak, XP, solved problems by difficulty, and contribution heatmap. Stay motivated with daily goals and milestones.",
    cta: "Open Dashboard",
    destination: "/",
    icon: BookmarkCheck,
  },
];

const proTips = [
  {
    title: "Design Daily Momentum",
    notes: [
      "Keep the daily goal tight (2–3 problems) so you always close loops.",
      "Review the Contribution heatmap weekly—chase streaks, not raw counts.",
    ],
    icon: Target,
  },
  {
    title: "Curate Your Vault",
    notes: [
      "Normalize tags (graph, dp, sliding window) so search surfaces related tactics automatically.",
      "Attach multiple approaches per problem to build a playbook of reusable patterns.",
    ],
    icon: ListChecks,
  },
  {
    title: "Accelerate Feedback",
    notes: [
      "Log blockers in the notes field while they’re fresh—future-you will thank you.",
      "Use snippets for reusable templates (fast I/O, traversal skeletons) to reduce context switching.",
    ],
    icon: Zap,
  },
];

const baseMotion = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" },
};

export default function Guide() {
  const [, setLocation] = useLocation();

  return (
    <div className="relative min-h-full bg-background pb-16">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pt-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setLocation("/profile")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </Button>
          <Badge variant="outline" className="gap-2 border-purple-500/40 bg-purple-500/10 text-purple-500">
            <Sparkles className="h-3 w-3" />
            CodeVault Playbook
          </Badge>
        </div>

        {/* Scroll Prompt */}
        <motion.div
          {...baseMotion}
          className="text-center py-4 px-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg"
        >
          <p className="text-sm text-muted-foreground">
            📖 <span className="font-semibold">Welcome to the CodeVault Playbook!</span> Scroll down to explore how to get the most out of CodeVault.
          </p>
        </motion.div>

        <motion.section
          {...baseMotion}
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-slate-100 shadow-[0_35px_120px_-50px_rgba(99,102,241,0.6)]"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/20 blur-2xl" />
          <div className="absolute -bottom-10 left-20 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="relative z-10 grid gap-12 p-10 md:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em]">
                <Sparkles className="h-3 w-3 text-amber-300" />
                Guided Success
              </div>
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                Turn every practice session into a repeatable win.
              </h1>
              <p className="text-base text-slate-300 md:text-lg">
                This guide shows how to combine dashboard insights, semantic tag search, and the workspace
                canvas to accelerate your problem-solving journey. Glide through our recommended rituals and
                discover where each feature compounds your prep time.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="gap-2 bg-purple-500 text-white shadow-[0_20px_60px_rgba(168,85,247,0.45)] hover:bg-purple-500/90"
                  onClick={() => setLocation("/questions")}
                >
                  Explore Questions
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-800/80"
                  onClick={() => setLocation("/workspace")}
                >
                  Jump to Workspace
                </Button>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Rhythm for high-impact learning</h3>
                  <p className="text-sm text-slate-300">
                    Adopt the capture → organize → execute loop to turn scattered practice into a system.
                  </p>
                </div>
                <div className="grid gap-4">
                  {journeyPhases.map((phase) => {
                    const Icon = phase.icon;
                    return (
                      <div
                        key={phase.label}
                        className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.07] p-4"
                      >
                        <div
                          className={`absolute inset-0 -z-10 opacity-70 blur-2xl ${`bg-gradient-to-br ${phase.accent}`}`}
                        />
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-slate-900/80 p-2 shadow-inner">
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-[0.3em] text-white/70">{phase.label}</p>
                            <h4 className="text-base font-semibold text-white">{phase.title}</h4>
                            <p className="text-xs text-slate-200">{phase.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section {...baseMotion} className="space-y-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold">Your CodeVault Journey</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Follow these phases each week to keep your vault breathing and your skills compounding.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {journeyPhases.map((phase, index) => {
              const Icon = phase.icon;
              return (
                <motion.div
                  key={phase.label}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur"
                >
                  <div className={`pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${`bg-gradient-to-br ${phase.accent}`}`} />
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{phase.label}</p>
                      <h3 className="text-lg font-semibold">{phase.title}</h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{phase.description}</p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {phase.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section {...baseMotion} className="space-y-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold">Rituals That Stick</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Blend these scenarios into your schedule to keep preparation light, intentional, and trackable.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {scenarios.map((scenario, index) => {
              const Icon = scenario.icon;
              return (
                <motion.div
                  key={scenario.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.55, delay: index * 0.12 }}
                  className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{scenario.title}</h3>
                      <p className="text-sm text-muted-foreground">{scenario.description}</p>
                    </div>
                    <div className="rounded-full border border-border/60 bg-background/80 p-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-6 gap-2 pl-0 text-sm text-primary hover:text-primary"
                    onClick={() => setLocation(scenario.destination)}
                  >
                    {scenario.cta}
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section {...baseMotion} className="space-y-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold">Power Tips</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Scale your learning loop with habits proven by advanced users.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {proTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full border-border/60 bg-card/70 backdrop-blur">
                    <CardContent className="space-y-4 p-6">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full border border-border/60 bg-background/80 p-3">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">{tip.title}</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {tip.notes.map((note) => (
                          <li key={note} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          {...baseMotion}
          className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-10"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">Ready to make this routine yours?</h2>
              <p className="text-sm text-muted-foreground md:text-base">
                Bookmark this guide from your profile menu anytime. Consistency beats intensity—lean on
                CodeVault to keep the rhythm.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                className="gap-2"
                onClick={() => setLocation("/profile")}
              >
                Back to Profile
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-border/70"
                onClick={() => setLocation("/")}
              >
                Review Dashboard
              </Button>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
