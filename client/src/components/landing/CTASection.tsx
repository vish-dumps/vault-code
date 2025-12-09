import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";

export function CTASection() {
    return (
        <section className="bg-gradient-to-b from-[#041426] to-[#0f2e4a] text-center py-9 mt-[-10px] relative overflow-hidden min-h-[250px] flex items-center justify-center">
            <div className="container mx-auto max-w-3xl relative z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-cyan-500/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

                <motion.h2
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="text-5xl md:text-6xl font-bold mb-8 text-white"
                >
                    Ready to Level Up?
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                    className="text-xl text-gray-400 mb-10"
                >
                    Join thousands of developers tracking their journey to mastery.
                    Free forever for students.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    viewport={{ once: true }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    <Link href="/auth">
                        <Button className="rounded-full h-16 px-10 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 border-0">
                            Start Your Adventure <ChevronRight className="ml-2 w-6 h-6" />
                        </Button>
                    </Link>
                    <div className="text-gray-500 text-sm">Or <a href="/install" className="text-cyan-400 underline underline-offset-4 hover:text-cyan-300">download the extension</a> directly</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, rotate: 12, x: 20 }}
                    whileInView={{ opacity: 1, rotate: 12, x: 0 }}
                    transition={{ delay: 0.6 }}
                    viewport={{ once: true }}
                    className="mt-16 flex justify-center pointer-events-none"
                >
                    <div className="relative relative flex items-center justify-center w-full max-w-[700px]">
                        <img src="/kody/kody.png" alt="Kody" className="absolute left-[-200px] top-[-80px] w-56 h-56 object-contain drop-shadow-2xl scale-[3.3]" />
                        {/* <div className="absolute -right-24 top-10 transform rotate-12">
                            <div className="bg-white text-black font-handwriting px-4 py-2 rounded-lg shadow-xl font-bold animate-bounce">
                                Let's Code! 🚀
                            </div>
                            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-t-[15px] border-t-white border-r-[10px] border-r-transparent absolute -left-2 top-4 -rotate-90"></div>
                        </div> */}
                    </div>
                    <div className="relative relative flex items-center justify-center w-full max-w-[700px]">
                        <div className="absolute right-[-130px] bottom-[10px] scale-x-[-1]">
                            <img src="/kody/kody.png" alt="Kody" className="w-56 h-56 object-contain drop-shadow-2xl scale-[2] " /></div>

                        {/* <div className="absolute -right-24 top-10 transform rotate-12">
                            <div className="bg-white text-black font-handwriting px-4 py-2 rounded-lg shadow-xl font-bold animate-bounce">
                                Let's Code! 🚀
                            </div>
                            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-t-[15px] border-t-white border-r-[10px] border-r-transparent absolute -left-2 top-4 -rotate-90"></div>
                        </div> */}
                    </div>

                </motion.div>
            </div>
        </section>
    );
}
