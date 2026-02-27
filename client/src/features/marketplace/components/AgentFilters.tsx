import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dispatch, SetStateAction } from "react";

const CATEGORIES = [
    { id: 'all', name: 'All Agents' },
    { id: 'Research', name: 'Research' },
    { id: 'Analysis', name: 'Analysis' },
    { id: 'Writing', name: 'Writing' },
];

export interface AgentFiltersProps {
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    selectedCategory: string;
    setSelectedCategory: Dispatch<SetStateAction<string>>;
}

export function AgentFilters({
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory
}: AgentFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                    type="text"
                    placeholder="Search agents by name, tag, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-500"
                />
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full md:w-auto">
                <TabsList className="bg-black/40 border border-white/10 w-full md:w-auto">
                    {CATEGORIES.map((cat) => (
                        <TabsTrigger
                            key={cat.id}
                            value={cat.id}
                            className="data-[state=active]:bg-[#F1A70E] data-[state=active]:text-black"
                        >
                            {cat.name}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
    );
}
