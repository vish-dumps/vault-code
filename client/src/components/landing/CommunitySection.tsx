import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function CommunitySection() {
    return (
        <section id="community" className="py-20 px-6 bg-[#061b33] relative overflow-hidden">
            <div className="container mx-auto text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 text-white">You're Never Coding Alone</h2>
                <p className="text-gray-400">Join a circle, compete with friends, and grow together.</p>
            </div>

            <div className="container mx-auto max-w-4xl relative">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative bg-[#041426] rounded-2xl p-8 border border-gray-700 shadow-2xl"
                >
                    {/* Decorative Header */}
                    <div className="flex items-center justify-between border-b border-gray-800 pb-6 mb-6">
                        <div className="flex items-center gap-3">
                            <Users className="text-violet-400" />
                            <span className="font-bold text-white">Algorithm Squad</span>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">5 Online</span>
                        </div>
                        <Button variant="secondary" className="h-8 text-xs bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-cyan-500/30">Invite Friend</Button>
                    </div>

                    {/* Friends List */}
                    <div className="space-y-4">
                        {[
                            { name: "SarahDev", rank: "Level 15", status: "Solving Two Sum...", img: "bg-pink-500" },
                            { name: "AlgoKing", rank: "Level 22", status: "Online", img: "bg-blue-500" },
                            { name: "Pythonista", rank: "Level 8", status: "Last seen 2m ago", img: "bg-green-500" },
                        ].map((friend, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full ${friend.img} flex items-center justify-center font-bold text-white shadow-lg`}>
                                        {friend.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">{friend.name}</div>
                                        <div className="text-xs text-gray-500">{friend.rank}</div>
                                    </div>
                                </div>
                                <div className="text-xs font-mono text-cyan-500/80">{friend.status}</div>
                            </div>
                        ))}
                    </div>

                    {/* Kody Overlay - Using PNG */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                        viewport={{ once: true }}
                        className="absolute -bottom-10 -right-10 hidden md:block"
                    >
                        <div className="relative">
                            <img src="/kody/kody.png" alt="Kody" className="w-80 h-auto transform -scale-x-100 translate-x-[100px] drop-shadow-2xl" />
                            <div className="absolute -top-0 -left-[-20px] bg-white text-black text-sm p-3 rounded-xl rounded-br-none shadow-lg font-bold scale-[0.8]">
                                Invite friends for 2x XP! 🚀
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
