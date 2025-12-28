import { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, X } from 'lucide-react';

interface ExportMenuProps {
    onExportPDF: () => void;
    onExportExcel: () => void;
    disabled?: boolean;
}

export function ExportMenu({ onExportPDF, onExportExcel, disabled }: ExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="p-2.5 bg-background-secondary border border-neutral-700 rounded-lg hover:bg-background-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export"
            >
                <Download size={18} className="text-neutral-300" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-background-secondary border border-neutral-700 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="px-3 py-2 border-b border-neutral-700 flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-300">Export As</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-background-tertiary rounded transition-colors"
                        >
                            <X size={14} className="text-neutral-400" />
                        </button>
                    </div>

                    <div className="p-2">
                        <button
                            onClick={() => {
                                onExportPDF();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-tertiary transition-colors text-left"
                        >
                            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                                <FileText size={16} className="text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-100">PDF</p>
                                <p className="text-xs text-neutral-500">Download as PDF</p>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                onExportExcel();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-tertiary transition-colors text-left mt-1"
                        >
                            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <FileSpreadsheet size={16} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-100">Excel</p>
                                <p className="text-xs text-neutral-500">Download as XLSX</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
