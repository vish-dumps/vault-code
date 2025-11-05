import { Card, CardContent } from "@/components/ui/card";
import { Rocket, Target, Lightbulb, Heart, Code, Users, Zap, Shield } from "lucide-react";

export default function About() {
  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          About CodeVault
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your personal coding companion — tracking, organizing, and celebrating your coding journey
        </p>
      </div>

      {/* Mission */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">🚀 Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                At CodeVault, we believe every line of code you write tells a story — a story of growth,
                learning, and persistence. Our mission is simple: to make every coder's journey visible,
                measurable, and shareable — effortlessly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Began */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">🔍 How It All Began</h2>
              <p className="text-muted-foreground leading-relaxed">
                CodeVault began as a personal frustration — constantly losing track of solved coding problems.
                Between LeetCode sessions and late-night Codeforces grinds, I realized how much effort was
                getting lost in the noise. So I decided to fix it.
              </p>
              <blockquote className="border-l-4 border-purple-500 pl-4 italic text-muted-foreground">
                "If practice is what shapes a coder, why not make that practice visible?"
              </blockquote>
              <p className="text-muted-foreground leading-relaxed">
                That idea became CodeVault — an extension that automatically tracks your solved problems,
                organizes them neatly, and syncs them directly to GitHub. What started as a small tool to
                help me stay consistent has evolved into something bigger — a way for any coder to build
                their own coding legacy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Makes CodeVault Special */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold">🧠 What Makes CodeVault Special</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Automatic Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Detects and saves your solved problems instantly.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">XP System</h3>
              <p className="text-sm text-muted-foreground">
                Earn XP based on problem difficulty — Easy, Medium, or Hard — turning learning into motivation.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Smart Syncing</h3>
              <p className="text-sm text-muted-foreground">
                Securely connects to your GitHub, maintaining a live record of your coding growth.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Personal & Social</h3>
              <p className="text-sm text-muted-foreground">
                Track your stats, challenge friends, and stay consistent together.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Multi-Platform Support</h3>
              <p className="text-sm text-muted-foreground">
                Works across LeetCode, Codeforces, and more (with new platforms coming soon).
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Modern Tech Stack</h3>
              <p className="text-sm text-muted-foreground">
                Built using React, Express, and MongoDB for speed, reliability, and smooth integration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vision */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">🌱 The Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                CodeVault is more than a productivity tool — it's a community-driven ecosystem in the making.
                A place where coders can:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Track their progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Collaborate and compete</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Learn from each other, and</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Celebrate their milestones together</span>
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed font-semibold">
                The goal? To make coding not just about solving problems, but about celebrating growth.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creator */}
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-teal-500">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">👤 The Creator</h2>
              <p className="text-muted-foreground leading-relaxed">
                Hey there — I'm <span className="font-semibold text-foreground">Vishwas Soni</span>, the creator of CodeVault 👋
              </p>
              <p className="text-muted-foreground leading-relaxed">
                A student at <span className="font-semibold text-foreground">IIT Kharagpur</span>. What started as a simple project to manage my coding journey has turned into something that's helping others stay motivated and organized too.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                I built CodeVault to make learning fun, visible, and rewarding — because every coder deserves to see how far they've come.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Join the Journey */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">✨ Join the Journey</h2>
              <p className="text-muted-foreground leading-relaxed">
                Whether you're preparing for interviews or just enjoy solving problems — CodeVault is your
                personal archive of growth.
              </p>
              <p className="font-semibold text-lg text-purple-700 dark:text-purple-300">
                Start tracking. Start sharing. Start building your coding story today.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Values */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">🧭 Our Values</h2>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">Open Source</span>
                  <span className="text-muted-foreground">— built for coders, by a coder.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">Transparent</span>
                  <span className="text-muted-foreground">— your data belongs to you.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">Community-Driven</span>
                  <span className="text-muted-foreground">— every user helps shape the future of CodeVault.</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Copyright */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              © 2025 CodeVault (Vishwas Soni). All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Unauthorized copying, distribution, or derivative works are prohibited without express permission.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
