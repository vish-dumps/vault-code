import { Flame, Shield, Zap, Star, Trophy, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function GamificationSection() {
    const [xp, setXp] = useState(1240);
    const streak = 14;

    // Simulated XP counter animation
    useEffect(() => {
        const interval = setInterval(() => {
            setXp(prev => (prev < 2000 ? prev + 5 : 1240));
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <section id="gamification" className="py-20 px-6 bg-[#041426] overflow-hidden">
            <div className="container mx-auto grid lg:grid-cols-2 gap-16 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="order-2 lg:order-1 relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-3xl rounded-full" />

                    <div className="relative bg-gray-900/40 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:border-cyan-500/30 transition-all duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Weekly Progress</h3>
                                <p className="text-gray-400 text-sm">Keep the streak alive!</p>
                            </div>
                            <div className="flex items-center gap-2 bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20">
                                <Flame className="text-orange-500 fill-orange-500 animate-pulse" />
                                <span className="font-bold text-orange-500">{streak} Day Streak</span>
                            </div>
                        </div>

                        {/* XP Bar */}
                        <div className="mb-8">
                            <div className="flex justify-between text-sm mb-2 font-bold">
                                <span className="text-cyan-400">Level 12: Code Ninja</span>
                                <span className="text-gray-400">{xp} / 2000 XP</span>
                            </div>
                            <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-100 ease-out relative"
                                    style={{ width: `${(xp / 2000) * 100}%` }}
                                >
                                    <div className="absolute top-0 right-0 h-full w-1 bg-white/50 animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { icon: Shield, color: "text-yellow-400", bg: "bg-yellow-400/10" },
                                { icon: Zap, color: "text-purple-400", bg: "bg-purple-400/10" },
                                { icon: Star, color: "text-blue-400", bg: "bg-blue-400/10" },
                                { icon: Trophy, color: "text-gray-600", bg: "bg-gray-800" }, // Locked
                            ].map((badge, i) => (
                                <div key={i} className={`aspect-square rounded-xl ${badge.bg} flex items-center justify-center border border-white/5 hover:scale-105 transition-transform`}>
                                    <badge.icon className={badge.color} size={28} />
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="order-1 lg:order-2 space-y-6"
                >
                    <h2 className="text-4xl font-bold text-white">
                        Turn Your <span className="text-orange-500">Grind</span> <br />
                        Into a <span className="text-cyan-400">Game</span>
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Why should coding be boring? CodeVault introduces RPG elements to your daily practice.
                        Earn XP for every problem solved, maintain streaks, and unlock unique badges as you master new algorithms.
                    </p>

                    <ul className="space-y-4 mt-6">
                        {[
                            "Visual XP bars for instant feedback",
                            "League system: Apprentice to Grandmaster",
                            "Daily challenges and streak protection"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                    <CheckCircle size={14} className="text-cyan-400" />
                                </div>
                                <span className="text-gray-300">{item}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            </div>
        </section>
    );
}
