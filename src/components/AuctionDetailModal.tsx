import { X, User, Phone, Calendar, Package, IndianRupee } from 'lucide-react';
import dayjs from 'dayjs';
import type { Auction } from '../api';

interface AuctionDetailModalProps {
    auction: Auction | null;
    isOpen: boolean;
    onClose: () => void;
    onMarkPaid?: (id: string) => void;
}

export function AuctionDetailModal({
    auction,
    isOpen,
    onClose,
    onMarkPaid,
}: AuctionDetailModalProps) {
    if (!isOpen || !auction) return null;

    const formattedDate = dayjs(auction.auctionDate).format('DD MMM YYYY');
    const formattedCreatedAt = dayjs(auction.createdAt).format('DD MMM YYYY, hh:mm A');
    const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(parseFloat(auction.totalAmount));

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />

            <div className="relative bg-background-secondary w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-700 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-background-secondary border-b border-neutral-700 px-4 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-100">Auction Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
                    >
                        <X size={20} className="text-neutral-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Action Button */}
                    {!auction.isPaid && onMarkPaid && (
                        <button
                            onClick={() => {
                                onMarkPaid(auction.id);
                                onClose();
                            }}
                            className="btn btn-success w-full py-3 shadow-lg shadow-green-500/20"
                        >
                            Mark as Paid
                        </button>
                    )}

                    {/* Person Info */}
                    <div className="card space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                                <User size={20} className="text-accent" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Person Name</p>
                                <p className="font-semibold text-neutral-100">{auction.personName}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                <Phone size={20} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Mobile Number</p>
                                <p className="font-semibold text-neutral-100">{auction.mobileNumber}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                                <Calendar size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Auction Date</p>
                                <p className="font-semibold text-neutral-100">{formattedDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-3">
                            <Package size={18} className="text-neutral-400" />
                            <h3 className="font-semibold text-neutral-200">
                                Items ({auction.items.length})
                            </h3>
                        </div>

                        <div className="space-y-2">
                            {auction.items.map((item, index) => {
                                const itemTotal = item.quantity * parseFloat(String(item.price));
                                return (
                                    <div
                                        key={item.id || index}
                                        className="flex items-center justify-between py-2 px-3 bg-background-tertiary rounded-lg"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-neutral-100 truncate">
                                                {item.itemName}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {item.quantity} x ₹{parseFloat(String(item.price)).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-neutral-200 ml-3">
                                            ₹{itemTotal.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Total & Status */}
                    <div className="card bg-accent/10 border-accent/30">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <IndianRupee size={20} className="text-accent" />
                                <span className="font-medium text-neutral-300">Total Amount</span>
                            </div>
                            <span className="text-2xl font-bold text-accent">{formattedAmount}</span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-accent/20">
                            <span className="text-neutral-400">Payment Status</span>
                            <span
                                className={`badge ${auction.isPaid ? 'badge-success' : 'badge-danger'
                                    }`}
                            >
                                {auction.isPaid ? 'Paid' : 'Not Paid'}
                            </span>
                        </div>
                    </div>

                    {/* Created At */}
                    <div className="text-center text-xs text-neutral-500">
                        Created on {formattedCreatedAt}
                    </div>
                </div>
            </div>
        </div>
    );
}
