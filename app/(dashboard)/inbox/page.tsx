"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function InboxRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const query = searchParams.toString();
        router.replace(query ? `/conversations?${query}` : "/conversations");
    }, [router, searchParams]);

    return (
        <div className="flex h-full w-full items-center justify-center p-8 bg-white min-h-[300px]">
            <Loader2 className="animate-spin text-[#2F8F83]" size={24} />
        </div>
    );
}

export default function InboxPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-full w-full items-center justify-center p-8 bg-white min-h-[300px]">
                    <Loader2 className="animate-spin text-[#2F8F83]" size={24} />
                </div>
            }
        >
            <InboxRedirect />
        </Suspense>
    );
}
