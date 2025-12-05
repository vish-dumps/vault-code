import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Users, Trophy, BarChart3, Sparkles } from "lucide-react";

export default function LandingPage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
            },
        },
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Code2 className="w-5 h-5" />
                        </div>
                        CodeVault
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/auth">
                            <Button variant="ghost" className="hidden sm:flex hover:bg-primary/5">
                                Log in
                            </Button>
                        </Link>
                        <Link href="/auth">
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-4xl mx-auto text-center"
                    >
                        <motion.div variants={itemVariants} className="mb-6 flex justify-center">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 flex items-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                The Ultimate Coding Companion
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50"
                        >
                            Master Coding. <br />
                            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                                Together.
                            </span>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
                        >
                            Experience real-time collaboration, gamified learning, and powerful analytics.
                            CodeVault is the all-in-one platform for developers who want to grow faster.
                        </motion.p>

                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <Link href="/auth">
                                <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all hover:scale-105">
                                    Start Coding Now <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Link href="/auth">
                                <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full border-primary/20 hover:bg-primary/5 transition-all">
                                    View Demo
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-muted/30 relative">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to excel</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Powerful features designed to enhance your coding workflow and keep you motivated.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Users className="w-6 h-6 text-blue-500" />}
                            title="Real-Time Collaboration"
                            description="Code together in real-time with synchronized cursors, drawing canvas, and shared editor."
                            color="bg-blue-500/10"
                        />
                        <FeatureCard
                            icon={<Trophy className="w-6 h-6 text-orange-500" />}
                            title="Gamified Learning"
                            description="Keep your streak alive, earn XP, and track your daily progress with fire-themed visualizations."
                            color="bg-orange-500/10"
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-6 h-6 text-green-500" />}
                            title="Advanced Analytics"
                            description="Visualize your growth with detailed charts, problem distribution, and performance metrics."
                            color="bg-green-500/10"
                        />
                    </div>
                </div>
            </section>

            {/* Extension Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium mb-6">
                                    <Sparkles className="w-4 h-4" />
                                    Chrome Extension
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                                    Save problems instantly with <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                                        Smart Saver
                                    </span>
                                </h2>
                                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                    Never lose track of a problem again. Our browser extension lets you save questions directly from LeetCode and Codeforces with a single click.
                                </p>

                                <ul className="space-y-4 mb-8">
                                    {[
                                        "Auto-fills problem details and difficulty",
                                        "Scrapes your code solution automatically",
                                        "Syncs tags and notes instantly",
                                        "Works seamlessly with LeetCode & Codeforces"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className="text-foreground/80">{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button variant="outline" className="gap-2 rounded-full h-12 px-6 border-primary/20 hover:bg-primary/5">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg" alt="Chrome" className="w-5 h-5" />
                                    Add to Chrome
                                </Button>
                            </motion.div>
                        </div>

                        <div className="lg:w-1/2 relative">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="relative z-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-2 shadow-2xl border border-white/10"
                            >
                                <div className="bg-background rounded-lg overflow-hidden">
                                    {/* Mock Browser UI */}
                                    <div className="h-8 bg-muted/50 flex items-center px-4 gap-2 border-b border-border/50">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                        </div>
                                        <div className="flex-1 bg-background h-5 rounded-md mx-4" />
                                    </div>
                                    {/* Extension Preview Placeholder */}
                                    <div className="p-8 flex flex-col items-center justify-center min-h-[300px] bg-muted/20">
                                        <div className="w-64 p-4 bg-background rounded-lg shadow-lg border border-border/50">
                                            <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
                                                <div className="w-6 h-6 bg-primary/20 rounded-md" />
                                                <span className="font-bold text-sm">Smart Saver</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="h-2 bg-muted rounded w-3/4" />
                                                <div className="h-2 bg-muted rounded w-1/2" />
                                                <div className="h-20 bg-muted/50 rounded w-full mt-2" />
                                                <div className="h-8 bg-primary rounded w-full mt-2" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Decorative Elements */}
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-[80px] animate-pulse" />
                            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] animate-pulse delay-700" />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-3xl p-12 text-center border border-primary/10 backdrop-blur-sm">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to level up your coding journey?</h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                            Join thousands of developers who are already using CodeVault to master their craft.
                        </p>
                        <Link href="/auth">
                            <Button size="lg" className="h-14 px-10 text-xl rounded-full bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all hover:scale-105">
                                Get Started for Free
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-border/40 bg-muted/10">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 font-bold text-lg text-muted-foreground">
                        <Code2 className="w-5 h-5" />
                        CodeVault
                    </div>
                    <div className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} CodeVault. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
        >
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-6`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
}
