export function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`skeleton rounded-lg ${className}`} />;
}

export function AuctionCardSkeleton() {
    return (
        <div className="card space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
        </div>
    );
}
