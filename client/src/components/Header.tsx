import { Link } from 'wouter';
import { useWalletContext, WalletMultiButton, formatAVAX } from '@/contexts/WalletContext';
import { NetworkIndicator } from '@/components/NetworkIndicator';
import { Wallet, Menu, X, LogOut, User, Bot, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Assuming this utility exists, typical in shadcn

export default function Header() {
    const { isConnected, balance, userRole, disconnect, setUserRole } = useWalletContext();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Define navigation items based on role
    const getNavItems = () => {
        const common = [
            { label: 'Marketplace', href: '/marketplace' },
        ];

        if (!isConnected) return common;

        switch (userRole) {
            case 'creator': // Agent Developer
                return [
                    ...common,
                    { label: 'Creator Studio', href: '/creator' },
                    // keep old link accessible for now if needed
                    { label: 'My Agents (Legacy)', href: '/dashboard' },
                ];
            case 'dao': // Data Provider
                return [
                    ...common,
                    { label: 'DAO Portal', href: '/dao' },
                    // keep old link accessible for now if needed
                    { label: 'Provider Dashboard', href: '/provider-dashboard' },
                ];
            case 'user': // Consumer
            default:
                return [
                    ...common,
                    { label: 'My Dashboard', href: '/user-dashboard' },
                ];
        }
    };

    const navItems = getNavItems();

    const handleDisconnect = async () => {
        await disconnect();
        setMobileMenuOpen(false);
    };

    const handleResetRole = () => {
        setUserRole('guest'); // Allow re-selection
        setMobileMenuOpen(false);
    }

    return (
        <header className="border-b border-gray-800 bg-black/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="container py-3 md:py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/logo.svg" alt="Baseroot" className="h-8 md:h-10 w-auto" />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-6">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                                {item.label}
                            </Link>
                        ))}
                        <Link href="/v2/explorer" className="text-[#F1A70E] font-bold hover:text-white transition-colors border border-[#F1A70E]/30 px-2 py-1 rounded text-sm">
                            Protocol V2
                        </Link>
                    </nav>

                    {/* Wallet Section */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <NetworkIndicator />

                        {isConnected && userRole !== 'guest' && (
                            <div className="hidden md:flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={handleResetRole} className="text-xs text-gray-500 hover:text-white">
                                    Switch Role
                                </Button>
                            </div>
                        )}

                        {isConnected && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-xl border border-gray-800">
                                <Wallet className="w-4 h-4 text-[#F1A70E]" />
                                <span className="text-white font-medium text-sm">{formatAVAX(balance)}</span>
                            </div>
                        )}

                        <div className="hidden md:block">
                            <WalletMultiButton />
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 text-white hover:text-[#F1A70E] transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden mt-4 pb-4 border-t border-gray-800 pt-4 space-y-3">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href} className="block text-white hover:text-[#F1A70E] transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                                {item.label}
                            </Link>
                        ))}
                        <Link href="/v2/explorer" className="block text-[#F1A70E] font-bold hover:text-white transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                            Protocol V2 Explorer
                        </Link>
                        {isConnected && userRole !== 'guest' && (
                            <button onClick={handleResetRole} className="block w-full text-left text-gray-400 hover:text-white py-2 text-sm">
                                Switch Role ({userRole})
                            </button>
                        )}
                        <div className="pt-3 border-t border-gray-800">
                            <WalletMultiButton />
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
