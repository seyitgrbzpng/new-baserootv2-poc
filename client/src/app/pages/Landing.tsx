import { Button } from "@/components/ui/button";
import { GlassCard } from "@/shared/components/GlassCard";
import { setRole, BaserootRole } from "@/shared/lib/role";
import { useLocation, Link } from "wouter";
import {
    ArrowRight, ShieldCheck, Database, Bot, Search,
    WalletCards, Zap, Activity, ExternalLink
} from "lucide-react";

export default function Landing() {
    const [_, setLocation] = useLocation();

    const handleRoleSelect = (role: BaserootRole) => {
        setRole(role);
        if (role === "consumer") setLocation("/marketplace");
        if (role === "creator") setLocation("/creator");
        if (role === "dao") setLocation("/dao");
    };

    const scrollToRoles = () => {
        document.getElementById("roles-grid")?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="flex flex-col items-center">

            {/* --- HERO SECTION --- */}
            <section className="w-full max-w-6xl mx-auto px-6 pt-24 pb-20 text-center flex flex-col items-center animate-in fade-in duration-700">

                {/* Trust Chips */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
                        <Activity className="w-3.5 h-3.5" /> Fuji Testnet Live
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-wide">
                        <ShieldCheck className="w-3.5 h-3.5" /> Zero-Knowledge Dataset Privacy
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold tracking-wide">
                        <Zap className="w-3.5 h-3.5" /> On-chain Licensing
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight leading-tight mb-6 max-w-4xl">
                    Programmable AI Agent Commerce, <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F1A70E] to-amber-600">
                        backed by verifiable datasets.
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 font-medium">
                    DAO datasets → AI agents → on-chain licensing → transparent revenue distribution.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        size="lg"
                        onClick={scrollToRoles}
                        className="bg-[#F1A70E] hover:bg-[#F1A70E]/80 text-black font-bold h-14 px-8 text-lg shadow-[0_0_30px_rgba(241,167,14,0.3)] transition-all hover:shadow-[0_0_40px_rgba(241,167,14,0.5)]"
                    >
                        Get Started <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="h-14 px-8 text-lg border-white/10 hover:bg-white/5 text-white"
                        onClick={() => handleRoleSelect("consumer")}
                    >
                        Explore Marketplace
                    </Button>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section className="w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/5 relative">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
                    <p className="text-gray-400">A decentralized pipeline from raw data to intelligent agents.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Decorative connecting line */}
                    <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#F1A70E]/30 to-transparent -translate-y-1/2 z-0" />

                    <GlassCard className="relative z-10 flex flex-col items-center text-center p-8 bg-black/60">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                            <Database className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Step 1 — DAOs list datasets</h3>
                        <p className="text-gray-400 text-sm">Data providers securely upload encrypted datasets and register their on-chain provenance footprint.</p>
                    </GlassCard>

                    <GlassCard className="relative z-10 flex flex-col items-center text-center p-8 bg-black/60">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                            <Bot className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Step 2 — Creators build agents</h3>
                        <p className="text-gray-400 text-sm">Developers attach DAO datasets to fine-tune unique AI agents, registering the revenue splits on-chain.</p>
                    </GlassCard>

                    <GlassCard className="relative z-10 flex flex-col items-center text-center p-8 bg-black/60">
                        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
                            <WalletCards className="w-8 h-8 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Step 3 — Consumers buy access</h3>
                        <p className="text-gray-400 text-sm">End users purchase verified agent licenses, automatically streaming micropayments back to the creators and DAOs.</p>
                    </GlassCard>
                </div>
            </section>

            {/* --- THREE ROLES GRID --- */}
            <section id="roles-grid" className="w-full max-w-6xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Choose Your Path</h2>
                    <p className="text-gray-400">Select a role to enter the application ecosystem.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Consumer */}
                    <GlassCard
                        variant="interactive"
                        className="flex flex-col items-center text-center p-8 group"
                        onClick={() => handleRoleSelect("consumer")}
                    >
                        <Search className="w-12 h-12 text-gray-400 group-hover:text-white transition-colors mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-3">Consumer</h3>
                        <p className="text-gray-400 mb-8 flex-1">Browse the marketplace, buy licenses for specialized AI agents, and track your usage history.</p>
                        <Button variant="outline" className="w-full border-white/20 group-hover:bg-white group-hover:text-black">
                            Enter Marketplace
                        </Button>
                    </GlassCard>

                    {/* Creator */}
                    <GlassCard
                        variant="interactive"
                        className="flex flex-col items-center text-center p-8 group relative overflow-hidden"
                        onClick={() => handleRoleSelect("creator")}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-[#F1A70E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Bot className="w-12 h-12 text-[#F1A70E] group-hover:scale-110 transition-transform mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-3">Creator</h3>
                        <p className="text-gray-400 mb-8 flex-1 relative z-10">Deploy monetizable AI agents, attach verifiable DAO datasets, and register them on the blockchain.</p>
                        <Button className="w-full bg-[#F1A70E] text-black hover:bg-[#F1A70E]/90 relative z-10 shadow-[0_0_15px_rgba(241,167,14,0.2)]">
                            Open Creator Studio
                        </Button>
                    </GlassCard>

                    {/* DAO */}
                    <GlassCard
                        variant="interactive"
                        className="flex flex-col items-center text-center p-8 group"
                        onClick={() => handleRoleSelect("dao")}
                    >
                        <Database className="w-12 h-12 text-gray-400 group-hover:text-white transition-colors mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-3">DAO</h3>
                        <p className="text-gray-400 mb-8 flex-1">Upload encrypted datasets, register immutable provenance metadata, and start earning passive revenue.</p>
                        <Button variant="outline" className="w-full border-white/20 group-hover:bg-white group-hover:text-black">
                            Open DAO Portal
                        </Button>
                    </GlassCard>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="w-full border-t border-white/10 bg-black/80 py-12 mt-10">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Baseroot Logo" className="h-6 w-auto" />
                    </div>

                    <div className="text-sm text-gray-500 flex flex-col md:flex-row items-center gap-2 md:gap-6">
                        <span>Built on Avalanche Fuji Testnet</span>
                        <span className="hidden md:inline">•</span>
                        <span className="text-red-400/80">Testnet Disclaimer: Funds have no real value</span>
                    </div>

                    <div className="flex gap-4">
                        <a href="#" className="text-gray-500 hover:text-white flex items-center transition-colors">
                            Docs <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                        <a href="#" className="text-gray-500 hover:text-white flex items-center transition-colors">
                            GitHub <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
