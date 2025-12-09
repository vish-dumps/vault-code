import { motion } from "framer-motion";

export function ExtensionSection() {
    return (
        <section className="bg-[#041426] py-32 overflow-hidden">
            <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="space-y-6"
                >
                    <div className="text-cyan-400 font-bold tracking-widest text-sm uppercase">Seamless Integration</div>
                    <h2 className="text-4xl font-bold text-white">No Manual Logs. Just Code.</h2>
                    <p className="text-gray-400 text-lg">
                        CodeVault sits quietly in your browser. When you hit "Submit" on LeetCode, we verify the success and instantly archive your solution, complexity analysis, and notes.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 w-full text-center hover:border-green-500/50 transition-colors">
                            <div className="text-green-400 font-bold text-xl mb-1">LeetCode</div>
                            <div className="text-xs text-gray-500">Fully Supported</div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 w-full text-center hover:border-red-500/50 transition-colors">
                            <div className="text-red-400 font-bold text-xl mb-1">Codeforces</div>
                            <div className="text-xs text-gray-500">Beta Support</div>
                        </div>
                    </div>
                    <div className="pt-4">
                        <a href="/install">
                            <button className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2">
                                Get the Extension <span aria-hidden="true">&rarr;</span>
                            </button>
                        </a>
                    </div>
                </motion.div>

                {/* Browser Mockup */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative"
                >
                    <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl border border-gray-700">
                        {/* Browser Toolbar */}
                        <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-black">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <div className="bg-[#1e1e1e] flex-1 ml-4 rounded px-3 py-1 text-xs text-gray-400 font-mono text-center">
                                leetcode.com/problems/two-sum
                            </div>
                        </div>
                        {/* Content */}
                        <div className="p-6 font-mono text-xs relative min-h-[300px]">
                            <span className="text-purple-400">class</span> <span className="text-yellow-400">Solution</span> {'{'} <br />
                            &nbsp;&nbsp;<span className="text-purple-400">def</span> <span className="text-blue-400">twoSum</span>(self, nums, target): <br />
                            &nbsp;&nbsp;&nbsp;&nbsp;prevMap = {'{}'} <br />
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">for</span> i, n <span className="text-purple-400">in</span> <span className="text-blue-400">enumerate</span>(nums): <br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;diff = target - n <br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">if</span> diff <span className="text-purple-400">in</span> prevMap: <br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> [prevMap[diff], i] <br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;prevMap[n] = i
                            <br /> {'}'}

                            {/* Success Popup */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="absolute top-10 right-10 bg-[#041426] border border-cyan-500/50 p-4 rounded-lg shadow-[0_0_30px_rgba(0,210,255,0.3)] max-w-[200px]"
                            >
                                <div className="flex items-start gap-3">
                                    <img src="/kody/kody.png" alt="Kody" className="w-10 h-10 object-contain" />
                                    <div>
                                        <div className="text-green-400 font-bold mb-1">Accepted!</div>
                                        <div className="text-gray-300 text-[10px]">Saved to Vault. +50 XP gained.</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
