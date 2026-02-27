import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/shared/components/PageHeader";
import { AgentFilters } from "../components/AgentFilters";
import { AgentCard } from "../components/AgentCard";
import { Loader2, Bot } from "lucide-react";
import { EmptyState } from "@/shared/components/UIStates";

// Minimal agent type based on our needs
export interface AgentDisplay {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  pricePerUse: number;
  creatorWallet: string;
  datasetIds?: string[];
}

export default function MarketplaceHome() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: agents = [], isLoading } = trpc.agents.list.useQuery({
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    search: searchQuery || undefined,
  });

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return agents;
    const query = searchQuery.toLowerCase();
    return agents.filter(
      (agent: any) =>
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query) ||
        agent.tags.some((tag: string) => tag.toLowerCase().includes(query))
    );
  }, [agents, searchQuery]);

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Agent Marketplace"
        description="Browse, license, and interact with specialized AI agents powered by zero-knowledge datasets."
      />

      {/* Embedded Agent Filters for simplicity in PoC */}
      <AgentFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#F1A70E]" />
        </div>
      ) : filteredAgents.length === 0 ? (
        <EmptyState
          icon={<Bot className="w-12 h-12 opacity-50 text-gray-400" />}
          title="No Agents Found"
          description="Try adjusting your filters or search query."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent: AgentDisplay) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
