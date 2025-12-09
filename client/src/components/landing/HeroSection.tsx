import { motion } from "framer-motion";
import { ArrowRight, Zap, Users, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function HeroSection() {
    return (
        <section className="min-h-screen flex items-center justify-center pt-32 pb-20 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f2e4a] via-[#041426] to-[#041426]">
            {/* Background Elements */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />

            <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center z-10">
                <div className="space-y-8 text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold"
                    >
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                        </span>
                        v2.0 is live!
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl lg:text-7xl font-bold leading-tight text-white"
                    >
                        Track. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Compete.</span> <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Grow.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
                    >
                        CodeVault automatically saves your solved problems, tracks your XP, and turns your coding journey into a game. The ultimate companion for LeetCode & Codeforces.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                    >
                        <Link href="/auth">
                            <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold bg-gradient-to-r from-red-400 to-orange-600 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 border-0">
                                Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="/install">
                            <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg font-bold bg-gray-800/50 text-orange-400 border-cyan-500/30 hover:bg-gray-700 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300 backdrop-blur-sm">
                                <Zap className="mr-2 w-5 h-5" /> Install Extension
                            </Button>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center justify-center lg:justify-start gap-4 pt-4 text-sm text-gray-500"
                    >
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gray-700 border-2 border-[#041426] flex items-center justify-center text-xs text-white">
                                    <Users size={12} />
                                </div>
                            ))}
                        </div>
                        <p>Trusted by a growing community of coders</p>
                    </motion.div>
                </div>

                {/* Hero Visual */}
                <div className="relative group perspective-1000">
                    {/* Kody Float - Using PNG as requested */}
                    <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-20 -right-2 z-20 hidden lg:block pointer-events-none"
                    >
                        <div className="relative">
                            <img src="/kody/kody.gif" alt="Kody Mascot" className="w-56 h-56 translate-x-[100px] -scale-x-100 drop-shadow-2xl object-contain" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1 }}
                                className="absolute top-8 left-[35px] bg-white  text-black text-xs font-bold px-3 py-1 rounded-t-xl rounded-bl-xl shadow-lg transform rotate-6 "
                            >
                                I'll save that for you! 🔥
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Dashboard Mockup */}
                    <motion.div
                        initial={{ rotateY: 12, opacity: 0 }}
                        animate={{ rotateY: 12, opacity: 1 }}
                        whileHover={{ rotateY: 0 }}
                        transition={{ duration: 0.8 }}
                        className="relative bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl transform transition-all ease-out"
                    >
                        <div className="h-8 bg-gray-800 flex items-center px-4 gap-2 border-b border-gray-700">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <div className="ml-4 text-xs text-gray-500 font-mono">dashboard.codevault.app</div>
                        </div>
                        <div className="p-6 bg-[#0B1120] grid grid-cols-3 gap-4">
                            {/* Mockup Content */}
                            <div className="col-span-2 space-y-4">
                                <div className="bg-gray-800/50 h-32 rounded-lg p-4 border border-gray-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm text-gray-400">Activity Graph</span>
                                        <span className="text-xs text-green-400">+12% this week</span>
                                    </div>
                                    <div className="flex items-end gap-1 h-16">
                                        {[40, 60, 30, 80, 50, 90, 70, 40, 60, 85].map((h, i) => (
                                            <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-cyan-500/20 rounded-t-sm hover:bg-cyan-400 transition-colors"></div>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-800/50 h-24 rounded-lg p-4 border border-gray-700">
                                        <div className="text-xs text-gray-400 mb-1">Solved</div>
                                        <div className="text-2xl font-bold text-white">428</div>
                                    </div>
                                    <div className="bg-gray-800/50 h-24 rounded-lg p-4 border border-gray-700">
                                        <div className="text-xs text-gray-400 mb-1">Current Streak</div>
                                        <div className="text-2xl font-bold text-orange-500 flex items-center gap-2">
                                            14 <Flame size={20} className="animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-1 space-y-4">
                                <div className="bg-gray-800/50 h-full rounded-lg border border-gray-700 p-4 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-600 mb-2 flex items-center justify-center text-2xl">👑</div>
                                    <div className="text-sm font-bold text-white">Level 5</div>
                                    <div className="text-xs text-gray-400">Master Coder</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
