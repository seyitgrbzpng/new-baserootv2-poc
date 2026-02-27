import { PageHeader } from "@/shared/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h1 className="text-9xl font-bold text-white/10 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-200 mb-6">Page Not Found</h2>
            <p className="text-gray-400 mb-8 max-w-md">
                The page you're looking for doesn't exist or has been moved to a different routing structure.
            </p>
            <Button className="bg-[#F1A70E] hover:bg-[#F1A70E]/80 text-black font-semibold" asChild>
                <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>
            </Button>
        </div>
    );
}
