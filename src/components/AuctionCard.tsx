import { Printer } from 'lucide-react';
import dayjs from 'dayjs';
import type { Auction } from '../api';
import { printBill } from '../utils/print';

interface AuctionCardProps {
    auction: Auction;
    onMarkPaid?: (id: string) => void;
    isUpdating?: boolean;
}

export function AuctionCard({ auction, onMarkPaid, isUpdating }: AuctionCardProps) {
    const formattedDate = dayjs(auction.auctionDate).format('DD MMM YYYY');
    const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(parseFloat(auction.totalAmount));

    const handleMarkPaid = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onMarkPaid) {
            onMarkPaid(auction.id);
        }
    };

    const handlePrint = (e: React.MouseEvent) => {
        e.stopPropagation();
        printBill(auction);
    };

    return (
        <div className="card space-y-3 transition-all duration-200 hover:border-neutral-600 active:scale-[0.98]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-semibold text-neutral-100 truncate">
                        {auction.personName}
                    </h3>
                    <p className="text-sm text-neutral-400 mt-0.5">{formattedDate}</p>
                </div>
                <span
                    className={`badge shrink-0 ${auction.isPaid ? 'badge-success' : 'badge-danger'
                        }`}
                >
                    {auction.isPaid ? 'Paid' : 'Not Paid'}
                </span>
            </div>

            <div className="flex flex-col gap-1">
                <p className="text-xs text-neutral-500">
                    {auction.items.length} item{auction.items.length !== 1 ? 's' : ''} • Tap for details
                </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <span className="text-lg font-bold text-accent">{formattedAmount}</span>
                <div className="flex items-center gap-2">
                    {/* Print Bill Button */}
                    <button
                        onClick={handlePrint}
                        className="p-2 bg-background-tertiary hover:bg-neutral-600 rounded-lg transition-colors"
                        title="Print Bill"
                    >
                        <Printer size={18} className="text-neutral-300" />
                    </button>

                    {/* Mark as Paid Button */}
                    {!auction.isPaid && onMarkPaid && (
                        <button
                            onClick={handleMarkPaid}
                            disabled={isUpdating}
                            className="btn btn-success text-sm py-2 px-4"
                        >
                            {isUpdating ? 'Updating...' : 'Mark as Paid'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
