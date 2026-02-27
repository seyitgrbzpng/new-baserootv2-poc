import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { toast } from "sonner";
import { getRole } from "@/shared/lib/role";

// Pages migrated to feature structure
import Landing from "@/app/pages/Landing";
import Marketplace from "@/features/marketplace/pages/MarketplaceHome";
import AgentDetail from "@/features/marketplace/pages/AgentDetail";
import MarketplaceLicenses from "@/features/marketplace/pages/MarketplaceLicenses";
import MarketplaceHistory from "@/features/marketplace/pages/MarketplaceHistory";
import CreatorDashboard from "@/features/creator/pages/CreatorDashboard";
import CreatorAgents from "@/features/creator/pages/CreatorAgents";
import CreatorRevenue from "@/features/creator/pages/CreatorRevenue";
import RegisterAgent from "@/features/creator/pages/CreatorAgentNew";
import DaoPortal from "@/features/dao/pages/DaoDashboard";
import DatasetsPage from "@/features/dao/pages/DaoDatasets";
import DaoDatasetNew from "@/features/dao/pages/DaoDatasetNew";
import DaoProvenance from "@/features/dao/pages/DaoProvenance";
import DaoEarnings from "@/features/dao/pages/DaoEarnings";
import NotFound from "@/app/pages/NotFound";

import { AppShell } from "@/layouts/AppShell";
import { PublicLayout } from "@/layouts/PublicLayout";

export function AppRoutes() {
    const [location, setLocation] = useLocation();
    const role = getRole();

    // Role-based protection logic
    useEffect(() => {
        if (location === "/") return;

        if (!role) {
            toast.error("Unauthorized: Please select a role first.");
            setLocation("/");
            return;
        }

        const isMarketplaceRoute = location.startsWith("/marketplace");
        const isCreatorRoute = location.startsWith("/creator");
        const isDaoRoute = location.startsWith("/dao");

        if (
            (isMarketplaceRoute && role !== "consumer") ||
            (isCreatorRoute && role !== "creator") ||
            (isDaoRoute && role !== "dao")
        ) {
            toast.error("Unauthorized access for your current role.");
            setLocation("/");
        }
    }, [location, role, setLocation]);

    return (
        <Switch>
            {/* Public Route */}
            <Route path="/">
                <PublicLayout>
                    <Landing />
                </PublicLayout>
            </Route>

            {/* Authenticated Routes wrapped in AppShell */}
            <Route>
                <AppShell>
                    <Switch>
                        <Route path="/marketplace/agents/:id" component={AgentDetail} />
                        <Route path="/marketplace/licenses" component={MarketplaceLicenses} />
                        <Route path="/marketplace/history" component={MarketplaceHistory} />
                        <Route path="/marketplace" component={Marketplace} />

                        <Route path="/creator" component={CreatorDashboard} />
                        <Route path="/creator/agents" component={CreatorAgents} />
                        <Route path="/creator/agents/new" component={RegisterAgent} />
                        <Route path="/creator/revenue" component={CreatorRevenue} />

                        <Route path="/dao" component={DaoPortal} />
                        <Route path="/dao/datasets" component={DatasetsPage} />
                        <Route path="/dao/datasets/new" component={DaoDatasetNew} />
                        <Route path="/dao/provenance" component={DaoProvenance} />
                        <Route path="/dao/earnings" component={DaoEarnings} />

                        {/* Fallback */}
                        <Route>
                            {role ? <NotFound /> : null}
                        </Route>
                    </Switch>
                </AppShell>
            </Route>
        </Switch>
    );
}
