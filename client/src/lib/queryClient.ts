import { trpc } from "./trpc";
import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import { getLoginUrl } from "../const";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "../firebase-config";

export const queryClient = new QueryClient();

let currentIdToken: string | null =
    typeof window !== "undefined" ? localStorage.getItem("firebaseIdToken") : null;

if (typeof window !== "undefined") {
    onIdTokenChanged(auth, async user => {
        if (!user) {
            currentIdToken = null;
            localStorage.removeItem("firebaseIdToken");
            return;
        }
        try {
            currentIdToken = await user.getIdToken();
            localStorage.setItem("firebaseIdToken", currentIdToken);
        } catch {
            // ignore
        }
    });
}

const redirectToLoginIfUnauthorized = (error: unknown) => {
    if (!(error instanceof TRPCClientError)) return;
    if (typeof window === "undefined") return;

    const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
    if (!isUnauthorized) return;

    window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
    if (event.type === "updated" && event.action.type === "error") {
        redirectToLoginIfUnauthorized(event.query.state.error);
        console.error("[API Query Error]", event.query.state.error);
    }
});

queryClient.getMutationCache().subscribe(event => {
    if (event.type === "updated" && event.action.type === "error") {
        redirectToLoginIfUnauthorized(event.mutation.state.error);
        console.error("[API Mutation Error]", event.mutation.state.error);
    }
});

export const trpcClient = trpc.createClient({
    links: [
        httpBatchLink({
            url: "/api/trpc",
            transformer: superjson,
            fetch(input, init) {
                return globalThis.fetch(input, {
                    ...(init ?? {}),
                    credentials: "include",
                    headers: {
                        ...(init?.headers ?? {}),
                        ...(currentIdToken ? { Authorization: `Bearer ${currentIdToken}` } : {}),
                    },
                });
            },
        }),
    ],
});
