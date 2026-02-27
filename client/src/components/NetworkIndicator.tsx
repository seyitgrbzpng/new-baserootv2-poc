import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExternalLink, Droplets, Globe, AlertTriangle } from 'lucide-react';

export function NetworkIndicator() {
  const { data: config, isLoading } = trpc.platform.config.useQuery();

  if (isLoading || !config) {
    return (
      <Badge variant="outline" className="border-gray-600 text-gray-400">
        <Globe className="w-3 h-3 mr-1 animate-pulse" />
        Loading...
      </Badge>
    );
  }

  const isTestnet = config.network === 'fuji' || config.network === 'testnet';
  const networkColor = isTestnet ? 'purple' : 'green';
  const faucetUrl = isTestnet ? 'https://core.app/tools/testnet-faucet/?subnet=c&token=c' : undefined;

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`border-${networkColor}-500/50 text-${networkColor}-400 cursor-help`}
            style={{
              borderColor: isTestnet ? 'rgba(168, 85, 247, 0.5)' : 'rgba(34, 197, 94, 0.5)',
              color: isTestnet ? 'rgb(192, 132, 252)' : 'rgb(74, 222, 128)',
            }}
          >
            <Globe className="w-3 h-3 mr-1" />
            {config.networkName}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 border-gray-800">
          <div className="space-y-2 p-1">
            <p className="text-sm font-medium text-white">
              {isTestnet ? 'Test Network' : 'Production Network'}
            </p>
            <p className="text-xs text-gray-400">
              {isTestnet
                ? 'Using test AVAX. No real value.'
                : 'Using real AVAX. Transactions have real value.'}
            </p>
            {isTestnet && (
              <div className="flex items-center gap-1 text-xs text-yellow-400">
                <AlertTriangle className="w-3 h-3" />
                <span>Test environment</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {isTestnet && faucetUrl && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              onClick={() => window.open(faucetUrl, '_blank')}
            >
              <Droplets className="w-3 h-3 mr-1" />
              Faucet
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 border-gray-800">
            <p className="text-sm">Get free test AVAX from the faucet</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function NetworkBanner() {
  const { data: config } = trpc.platform.config.useQuery();

  const isTestnet = config?.network === 'fuji' || config?.network === 'testnet';
  const faucetUrl = isTestnet ? 'https://core.app/tools/testnet-faucet/?subnet=c&token=c' : undefined;

  if (!isTestnet) {
    return null;
  }

  return (
    <div className="bg-purple-500/10 border-b border-purple-500/20 py-2">
      <div className="container mx-auto px-4 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-purple-400">
          <AlertTriangle className="w-4 h-4" />
          <span>
            You are on <strong>{config.networkName}</strong> - Using test AVAX with no real value
          </span>
        </div>
        {faucetUrl && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
            onClick={() => window.open(faucetUrl, '_blank')}
          >
            <Droplets className="w-3 h-3 mr-1" />
            Get Test AVAX
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
