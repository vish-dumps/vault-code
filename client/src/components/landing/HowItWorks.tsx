import { Terminal, Cpu, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-20 px-6 bg-[#061b33] relative overflow-hidden">
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">How CodeVault Works</h2>
                    <p className="text-gray-400 max-w-xl mx-auto">Seamless integration with your favorite platforms. No manual entry required.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connection Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/20 via-cyan-500/50 to-cyan-500/20 z-0"></div>

                    {[
                        {
                            icon: Terminal,
                            title: "1. Solve Problems",
                            desc: "Code on LeetCode, Codeforces, or HackerRank as you normally would.",
                            color: "text-blue-400"
                        },
                        {
                            icon: Cpu,
                            title: "2. Auto-Detect",
                            desc: "Our extension automatically detects successful submissions and captures your code.",
                            color: "text-cyan-400"
                        },
                        {
                            icon: Trophy,
                            title: "3. Level Up",
                            desc: "Earn XP, unlock badges, and analyze your growth in your personal Vault.",
                            color: "text-orange-400"
                        }
                    ].map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 }}
                            viewport={{ once: true }}
                            className="relative z-10 group"
                        >
                            <div className="bg-[#041426] p-8 rounded-2xl border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 h-full flex flex-col items-center text-center shadow-lg group-hover:-translate-y-2">
                                <div className={`w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6 shadow-inner ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                                    <step.icon size={36} />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{step.desc}</p>

                                {index === 1 && (
                                    <div className="absolute -top-0 -right-4 hidden lg:block transform rotate-12">
                                        <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
                                            Zero friction!
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
