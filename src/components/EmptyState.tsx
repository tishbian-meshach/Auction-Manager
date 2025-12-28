import { Package } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-background-tertiary rounded-full flex items-center justify-center mb-4">
                <Package size={32} className="text-neutral-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-200 mb-2">{title}</h3>
            <p className="text-sm text-neutral-400 max-w-xs">{description}</p>
        </div>
    );
}
