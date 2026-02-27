import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User, Bot, Building2, CheckCircle2 } from 'lucide-react';
import { useWalletContext } from '@/contexts/WalletContext';

export default function OnboardingModal() {
    const { isConnected, userRole, setUserRole } = useWalletContext();

    // Show if connected but role is 'guest' (default)
    const isOpen = isConnected && userRole === 'guest';

    const roles = [
        {
            id: 'user',
            title: 'Consumer',
            description: 'I want to rent AI Agents for my tasks.',
            icon: User,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            id: 'creator',
            title: 'Developer',
            description: 'I want to build and monetize AI Agents.',
            icon: Bot,
            color: 'text-[#F1A70E]',
            bg: 'bg-[#F1A70E]/10'
        },
        {
            id: 'dao',
            title: 'DAO / Data Provider',
            description: 'I represent a DAO managing datasets.',
            icon: Building2,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10'
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="bg-gray-900 border-gray-800 sm:max-w-3xl [&>button]:hidden">
                <DialogHeader className="text-center pb-6">
                    <DialogTitle className="text-3xl font-bold text-white mb-2">Welcome to Baseroot</DialogTitle>
                    <DialogDescription className="text-gray-400 text-lg">
                        How do you plan to use the protocol? This customizes your experience.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {roles.map((role) => (
                        <Card
                            key={role.id}
                            className="bg-black/40 border-gray-800 hover:border-gray-600 hover:bg-gray-800/50 transition-all cursor-pointer group relative overflow-hidden"
                            onClick={() => setUserRole(role.id as any)}
                        >
                            <div className="p-6 flex flex-col items-center text-center h-full">
                                <div className={`w-16 h-16 rounded-2xl ${role.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <role.icon className={`w-8 h-8 ${role.color}`} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{role.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {role.description}
                                </p>
                                <div className="mt-auto pt-6 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button className="w-full bg-white text-black hover:bg-gray-200 font-bold">
                                        Select
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
