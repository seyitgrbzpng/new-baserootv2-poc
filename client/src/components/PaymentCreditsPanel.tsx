import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Ticket,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Sparkles,
  Key,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

// Sub-component for individual credit rows to handle localized state
function CreditRow({ credit, onUseCredit }: { credit: any, onUseCredit: (id: string, agentId: string) => void }) {
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const accessTokenMutation = trpc.gateway.getAccessTokenWithCredit.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      setShowToken(true);
      toast.success("Access Token generated!");
    },
    onError: (error) => {
      toast.error(`Failed to get token: ${error.message}`);
    }
  });

  const handleToggleToken = () => {
    if (showToken) {
      setShowToken(false);
      return;
    }

    if (token) {
      setShowToken(true);
    } else {
      accessTokenMutation.mutate({
        creditId: credit.id,
        userWallet: credit.userId
      });
    }
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      toast.success("Token copied to clipboard");
    }
  };

  const statusBadge = (() => {
    switch (credit.status) {
      case 'available':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Available</Badge>;
      case 'used':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Used</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Expired</Badge>;
      default:
        return <Badge variant="outline">{credit.status}</Badge>;
    }
  })();

  const formatDate = (date: any) => {
    const d = date && typeof date.toDate === 'function' ? date.toDate() : new Date(date);
    return d.toLocaleDateString('tr-TR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-semibold">{credit.agentName}</h4>
            {statusBadge}
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-1 text-sm">
            <p className="text-gray-400">
              <span className="text-gray-500">Amount:</span>{' '}
              <span className="text-[#F1A70E] font-semibold">
                {credit.amountPaid.toFixed(4)} {credit.currency}
              </span>
            </p>
            <p className="text-gray-400">
              <span className="text-gray-500">Purchased:</span>{' '}
              {formatDate(credit.createdAt)}
            </p>
          </div>

          <div className="flex flex-col gap-2 justify-center">
            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              {credit.status === 'available' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleToken}
                  disabled={accessTokenMutation.isPending}
                  className="border-gray-600 hover:bg-gray-700 text-gray-300 gap-2"
                >
                  {accessTokenMutation.isPending ? (
                    <span className="animate-spin">⌛</span>
                  ) : showToken ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  {showToken ? "Hide Key" : "Reveal Access Key"}
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => onUseCredit(credit.id || '', credit.agentId)}
                className="bg-[#F1A70E] hover:bg-[#F1A70E]/90 text-black"
              >
                {credit.status === 'available' ? 'Use Now' : 'Use Again'}
              </Button>
            </div>
          </div>
        </div>

        {/* Token Display Area */}
        {showToken && token && (
          <div className="mt-3 p-3 bg-black/40 rounded border border-gray-700 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-gray-500 uppercase">One-Time Access Token (JWT)</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={copyToken}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <code className="block w-full p-2 bg-black/60 rounded text-[10px] text-green-400 font-mono break-all border border-green-900/30">
              {token}
            </code>
            <p className="mt-2 text-[10px] text-amber-500/80 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Valid for 5 minutes. Use via SDK or API.
            </p>
          </div>
        )}

        <div className="border-t border-gray-700 pt-3 mt-3">
          <a
            href={`https://testnet.snowtrace.io/tx/${credit.txSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-[#F1A70E] flex items-center gap-1"
          >
            View Transaction <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

interface PaymentCreditsPanelProps {
  walletAddress: string;
  onUseCredit?: (creditId: string, agentId: string) => void;
}

export function PaymentCreditsPanel({ walletAddress, onUseCredit }: PaymentCreditsPanelProps) {
  const [selectedTab, setSelectedTab] = useState('available');

  // Fetch all credits
  const { data: credits = [], refetch } = trpc.paymentCredits.getAll.useQuery(
    { walletAddress },
    { enabled: !!walletAddress }
  );

  // Fetch credit stats
  const { data: stats } = trpc.paymentCredits.getStats.useQuery(
    { walletAddress },
    { enabled: !!walletAddress }
  );

  const availableCredits = credits.filter(c => c.status === 'available');
  const usedCredits = credits.filter(c => c.status === 'used');
  const expiredCredits = credits.filter(c => c.status === 'expired');

  const handleUseCredit = (creditId: string, agentId: string) => {
    if (onUseCredit) {
      onUseCredit(creditId, agentId);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#F1A70E]" />
              Payment Credits
            </CardTitle>
            <CardDescription>
              Your unused agent usage credits
            </CardDescription>
          </div>
          {stats && (
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{stats.available}</p>
              <p className="text-sm text-gray-400">Available</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-black/50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.available}</p>
              <p className="text-xs text-gray-400">Available</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.used}</p>
              <p className="text-xs text-gray-400">Used</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#F1A70E]">{stats.totalValue.toFixed(4)}</p>
              <p className="text-xs text-gray-400">Total Value (AVAX)</p>
            </div>
          </div>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="available" className="data-[state=active]:bg-[#F1A70E] data-[state=active]:text-black">
              Available ({availableCredits.length})
            </TabsTrigger>
            <TabsTrigger value="used" className="data-[state=active]:bg-[#F1A70E] data-[state=active]:text-black">
              Used ({usedCredits.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="data-[state=active]:bg-[#F1A70E] data-[state=active]:text-black">
              Expired ({expiredCredits.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-4">
            <ScrollArea className="h-[400px]">
              {availableCredits.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No available credits</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Credits are created when you pay for an agent but don't use it immediately
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableCredits.map((credit) => (
                    <CreditRow
                      key={credit.id}
                      credit={credit}
                      onUseCredit={handleUseCredit}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="used" className="mt-4">
            <ScrollArea className="h-[400px]">
              {usedCredits.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No used credits yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {usedCredits.map((credit) => (
                    <CreditRow
                      key={credit.id}
                      credit={credit}
                      onUseCredit={handleUseCredit}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="expired" className="mt-4">
            <ScrollArea className="h-[400px]">
              {expiredCredits.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No expired credits</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiredCredits.map((credit) => (
                    <CreditRow
                      key={credit.id}
                      credit={credit}
                      onUseCredit={handleUseCredit}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
