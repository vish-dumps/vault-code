import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Download, Zap } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function InstallPage() {
    return (
        <div className="min-h-screen bg-[#041426] text-white font-sans overflow-x-hidden selection:bg-cyan-500/30 flex flex-col">
            {/* Navigation */}
            <nav className="py-6 border-b border-white/5 bg-[#041426]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <Link href="/">
                        <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer group">
                            <div className="relative transition-transform duration-300 group-hover:scale-110">
                                <img src="/kody/icon128.png" alt="Kody" className="w-10 h-10 object-contain drop-shadow-md scale-[1.2]" />
                            </div>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                                CodeVault
                            </span>
                        </div>
                    </Link>
                    <Link href="/auth">
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/10">
                            Return to App
                        </Button>
                    </Link>
                </div>
            </nav>

            <main className="flex-grow container mx-auto px-6 py-12 flex flex-col items-center justify-center relative">
                {/* Background Elements */}
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
                <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse delay-700" />

                <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
                    {/* Left Column: Content */}
                    <div className="space-y-8 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider"
                        >
                            <Zap size={14} /> Official Extension
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black tracking-tight"
                        >
                            Power Up Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                Coding Journey
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-gray-400 leading-relaxed"
                        >
                            The CodeVault Smart Saver automatically captures your solutions from LeetCode and Codeforces. Never manually copy-paste code again.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4"
                        >
                            <a href="https://chromewebstore.google.com/detail/codevault-smart-saver/nhdcobncmjbnjcmiiallldjgeeldmlgb?authuser=0&hl=en" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="w-full sm:w-auto rounded-full h-14 px-8 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 border-0">
                                    <Download className="mr-2 w-5 h-5" /> Get it on Chrome Web Store
                                </Button>
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-6 justify-center lg:justify-start text-sm text-gray-400 pt-4"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle className="text-green-500 w-4 h-4" /> LeetCode Supported
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="text-green-500 w-4 h-4" /> Codeforces Beta
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Visual & Steps */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative"
                    >
                        <Card className="bg-[#0B1120]/80 border-gray-700/50 backdrop-blur-xl shadow-2xl overflow-hidden">
                            <CardContent className="p-8 space-y-8">
                                <div className="text-center pb-6 border-b border-gray-800">
                                    <div className="relative inline-block">
                                        <img src="/kody/kody.gif" alt="Kody" className="w-40 h-40 object-contain mx-auto drop-shadow-2xl" />
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 1, type: "spring" }}
                                            className="absolute -top-2 -right-6 bg-white text-black text-xs font-bold px-3 py-1 rounded-lg shadow-lg rotate-12"
                                        >
                                            Pin me! 📌
                                        </motion.div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mt-4">One-Click Installation</h3>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { num: 1, text: "Click the button to open Chrome Web Store" },
                                        { num: 2, text: "Click 'Add to Chrome'" },
                                        { num: 3, text: "Pin the extension for easy access" },
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                            <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0">
                                                {step.num}
                                            </div>
                                            <div className="pt-0.5">
                                                {step.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
