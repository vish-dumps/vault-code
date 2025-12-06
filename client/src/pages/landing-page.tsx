import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { GamificationSection } from "@/components/landing/GamificationSection";
import { CommunitySection } from "@/components/landing/CommunitySection";
import { ExtensionSection } from "@/components/landing/ExtensionSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTASection } from "@/components/landing/CTASection";

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // Scroll listener for navbar
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#041426] text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden">
            {/* --- Navigation --- */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#041426]/90 backdrop-blur-md py-4 border-b border-white/5' : 'py-6 bg-transparent'}`}>
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
                        <div className="relative">
                            <img src="/kody/icon128.png" alt="Kody" className="w-10 h-10 object-contain drop-shadow-md scale-[1.2]" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                            CodeVault
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                        <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How it Works</a>
                        <a href="#gamification" className="hover:text-cyan-400 transition-colors">Features</a>
                        <a href="#community" className="hover:text-cyan-400 transition-colors">Community</a>
                        <Link href="/auth">
                            <Button className="rounded-full bg-gradient-to-r from-orange-400 to-red-600 hover:scale-105 transition-all duration-300 border-0">
                                Get Started
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {menuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-[#041426] border-b border-white/10 p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-5">
                        <a href="#how-it-works" className="text-gray-300 py-2 hover:text-cyan-400" onClick={() => setMenuOpen(false)}>How it Works</a>
                        <a href="#gamification" className="text-gray-300 py-2 hover:text-cyan-400" onClick={() => setMenuOpen(false)}>Features</a>
                        <a href="#community" className="text-gray-300 py-2 hover:text-cyan-400" onClick={() => setMenuOpen(false)}>Community</a>
                        <Link href="/auth">
                            <Button className="w-full justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-600">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                )}
            </nav>

            <main>
                <HeroSection />
                <HowItWorks />
                <GamificationSection />
                <CommunitySection />
                <ExtensionSection />
                <Testimonials />
                <CTASection />
            </main>

            {/* --- Footer --- */}
            <footer className="border-t border-white/5 py-12 bg-[#041426]">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <img src="/kody/kody.png" alt="Kody" className="w-8 h-8 object-contain opacity-80" />
                        <span className="text-gray-300">CodeVault</span>
                    </div>

                    <div className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} CodeVault. Built by coders, for coders.
                    </div>

                    <div className="flex gap-6 text-gray-400">
                        <a href="https://vish-dumps.github.io/codevault-pp/" className="hover:text-cyan-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-cyan-400 transition-colors">Terms</a>
                        <a href="#" className="hover:text-cyan-400 transition-colors">Twitter</a>
                        <a href="#" className="hover:text-cyan-400 transition-colors">GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
