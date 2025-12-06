import { Star } from "lucide-react";
import { motion } from "framer-motion";

export function Testimonials() {
    return (
        <section className="bg-[#061b33] py-20 px-6">
            <div className="container mx-auto">
                <h2 className="text-center text-4xl font-bold mb-12 text-white">Developers Love CodeVault</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { name: "Alex Chen", role: "Software Engineer @ Google", text: "CodeVault turned my interview prep from a chore into a daily habit. The gamification is addictive!", stars: 5 },
                        { name: "Maria Garcia", role: "CS Student", text: "Finally, a way to track my progress across different platforms in one place. Kody is super cute too!", stars: 5 },
                        { name: "David Kim", role: "Frontend Dev", text: "It's like Strava for programmers. seeing my streak grow keeps me coming back every day.", stars: 4 },
                    ].map((review, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -5 }}
                            viewport={{ once: true }}
                            className="bg-gray-900/40 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:border-cyan-500/30 transition-all duration-300 shadow-lg"
                        >
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, si) => (
                                    <Star key={si} size={16} className={`${si < review.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                                ))}
                            </div>
                            <p className="text-gray-300 mb-6 italic">"{review.text}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-white shadow-md">
                                    {review.name[0]}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-white">{review.name}</div>
                                    <div className="text-xs text-gray-500">{review.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
