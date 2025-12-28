import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
            <div className="relative bg-background-secondary rounded-2xl p-6 w-full max-w-sm border border-neutral-700 shadow-xl">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-neutral-100 mb-1">{title}</h3>
                        <p className="text-sm text-neutral-400">{message}</p>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="btn btn-ghost flex-1"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn btn-success flex-1"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
