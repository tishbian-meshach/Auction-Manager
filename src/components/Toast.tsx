import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    visible: boolean;
    onClose: () => void;
}

export function Toast({ message, type, visible, onClose }: ToastProps) {
    if (!visible) return null;

    return (
        <div
            className={`fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 ${visible ? 'toast-enter' : 'toast-exit'
                }`}
        >
            <div
                className={`flex items-center gap-3 p-4 rounded-xl shadow-lg ${type === 'success'
                        ? 'bg-green-500/90 text-white'
                        : 'bg-red-500/90 text-white'
                    }`}
            >
                {type === 'success' ? (
                    <CheckCircle size={20} className="shrink-0" />
                ) : (
                    <XCircle size={20} className="shrink-0" />
                )}
                <span className="flex-1 text-sm font-medium">{message}</span>
                <button
                    onClick={onClose}
                    className="shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
