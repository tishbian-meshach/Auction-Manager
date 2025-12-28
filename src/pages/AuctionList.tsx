import { useState, useEffect, useMemo } from 'react';
import { Search, WifiOff, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import { api, type Auction } from '../api';
import { AuctionCard } from '../components/AuctionCard';
import { AuctionCardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AuctionDetailModal } from '../components/AuctionDetailModal';
import { ExportMenu } from '../components/ExportMenu';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { storage, network } from '../utils/storage';
import { exportToPDF, exportToExcel } from '../utils/export';
import { PullToRefresh } from '../components/PullToRefresh';

type FilterType = 'all' | 'month' | 'date';
type PaymentFilter = 'all' | 'paid' | 'unpaid';

export function AuctionList() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter states
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
    const [selectedMonth, setSelectedMonth] = useState(dayjs());
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; auctionId: string | null }>({
        isOpen: false,
        auctionId: null,
    });
    const { toast, showToast, hideToast } = useToast();

    const fetchAuctions = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            const online = await network.isOnline();
            setIsOffline(!online);

            if (online) {
                const data = await api.getAuctions();
                setAuctions(data);
                await storage.saveAuctions(data);
            } else {
                const cached = await storage.getAuctions();
                if (cached) {
                    setAuctions(cached);
                    showToast('Showing cached data (offline)', 'success');
                } else {
                    showToast('No cached data available', 'error');
                }
            }
        } catch (error) {
            const cached = await storage.getAuctions();
            if (cached) {
                setAuctions(cached);
                setIsOffline(true);
                showToast('Using cached data', 'success');
            } else {
                showToast('Failed to load auctions', 'error');
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        await fetchAuctions(true);
    };

    useEffect(() => {
        fetchAuctions();

        const listener = network.addListener((connected) => {
            setIsOffline(!connected);
            if (connected) {
                fetchAuctions();
            }
        });

        return () => {
            listener.then((l) => l.remove());
        };
    }, []);

    const handleAuctionClick = (auction: Auction) => {
        setSelectedAuction(auction);
    };

    const handleMarkPaid = (id: string) => {
        if (isOffline) {
            showToast('Cannot update while offline', 'error');
            return;
        }
        setConfirmDialog({ isOpen: true, auctionId: id });
    };

    const confirmMarkPaid = async () => {
        const id = confirmDialog.auctionId;
        if (!id) return;

        setConfirmDialog({ isOpen: false, auctionId: null });
        setUpdatingId(id);

        try {
            await api.markAsPaid(id);
            const updatedAuctions = auctions.map((auction) =>
                auction.id === id ? { ...auction, isPaid: true } : auction
            );
            setAuctions(updatedAuctions);
            await storage.saveAuctions(updatedAuctions);

            if (selectedAuction?.id === id) {
                setSelectedAuction({ ...selectedAuction, isPaid: true });
            }

            showToast('Payment status updated', 'success');
        } catch (error) {
            showToast('Failed to update payment status', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    // Filter and group auctions
    const filteredAndGrouped = useMemo(() => {
        let filtered = auctions;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (auction) =>
                    auction.personName.toLowerCase().includes(query) ||
                    auction.mobileNumber.includes(query)
            );
        }

        // Apply payment filter
        if (paymentFilter === 'paid') {
            filtered = filtered.filter((auction) => auction.isPaid);
        } else if (paymentFilter === 'unpaid') {
            filtered = filtered.filter((auction) => !auction.isPaid);
        }

        // Apply date/month filter
        if (filterType === 'month') {
            filtered = filtered.filter((auction) =>
                dayjs(auction.auctionDate).isSame(selectedMonth, 'month')
            );
        } else if (filterType === 'date') {
            filtered = filtered.filter((auction) =>
                dayjs(auction.auctionDate).isSame(selectedDate, 'day')
            );
        }

        // Group by month
        const grouped: Record<string, Auction[]> = {};

        filtered.forEach((auction) => {
            const monthKey = dayjs(auction.auctionDate).format('MMMM YYYY');
            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            grouped[monthKey].push(auction);
        });

        // Sort by month (most recent first), then by date within each month
        const sortedEntries = Object.entries(grouped)
            .sort(([a], [b]) => dayjs(b, 'MMMM YYYY').valueOf() - dayjs(a, 'MMMM YYYY').valueOf())
            .map(([month, auctionsInMonth]) => ({
                month,
                auctions: auctionsInMonth.sort(
                    (a, b) => dayjs(b.auctionDate).valueOf() - dayjs(a.auctionDate).valueOf()
                ),
            }));

        return sortedEntries;
    }, [auctions, searchQuery, paymentFilter, filterType, selectedMonth, selectedDate]);

    // Get counts for badges (based on current date/month filter)
    const counts = useMemo(() => {
        let baseFiltered = auctions;

        // Apply search filter first
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            baseFiltered = baseFiltered.filter(
                (auction) =>
                    auction.personName.toLowerCase().includes(query) ||
                    auction.mobileNumber.includes(query)
            );
        }

        // Apply date/month filter for counts
        if (filterType === 'month') {
            baseFiltered = baseFiltered.filter((auction) =>
                dayjs(auction.auctionDate).isSame(selectedMonth, 'month')
            );
        } else if (filterType === 'date') {
            baseFiltered = baseFiltered.filter((auction) =>
                dayjs(auction.auctionDate).isSame(selectedDate, 'day')
            );
        }

        const all = baseFiltered.length;
        const paid = baseFiltered.filter(a => a.isPaid).length;
        const unpaid = baseFiltered.filter(a => !a.isPaid).length;
        return { all, paid, unpaid };
    }, [auctions, searchQuery, filterType, selectedMonth, selectedDate]);

    // Get flat list of filtered auctions for export
    const filteredAuctions = useMemo(() => {
        return filteredAndGrouped.flatMap(group => group.auctions);
    }, [filteredAndGrouped]);

    const handleExportPDF = async () => {
        try {
            await exportToPDF(filteredAuctions, {
                filterType,
                paymentFilter,
                selectedMonth,
                selectedDate,
                searchQuery,
            });
        } catch (error) {
            console.error('Error exporting PDF:', error);
        }
    };

    const handleExportExcel = async () => {
        try {
            await exportToExcel(filteredAuctions, {
                filterType,
                paymentFilter,
                selectedMonth,
                selectedDate,
                searchQuery,
            });
        } catch (error) {
            console.error('Error exporting Excel:', error);
        }
    };

    return (
        <PullToRefresh onRefresh={handleRefresh} refreshing={isRefreshing}>
            <div className="min-h-screen pb-24 px-4 pt-6" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-neutral-100">Auctions</h1>
                    <div className="flex items-center gap-2">
                        <ExportMenu
                            onExportPDF={handleExportPDF}
                            onExportExcel={handleExportExcel}
                            disabled={filteredAuctions.length === 0}
                        />
                        {isOffline && (
                            <div className="flex items-center gap-1.5 text-amber-400">
                                <WifiOff size={16} />
                                <span className="text-xs font-medium">Offline</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-10 text-sm"
                        placeholder="Search by name or mobile"
                    />
                </div>

                {/* Filter Type: All, Month, Date */}
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filterType === 'all'
                            ? 'bg-accent text-white'
                            : 'bg-background-secondary text-neutral-400 hover:text-neutral-200'
                            }`}
                    >
                        All Time
                    </button>
                    <button
                        onClick={() => setFilterType('month')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filterType === 'month'
                            ? 'bg-accent text-white'
                            : 'bg-background-secondary text-neutral-400 hover:text-neutral-200'
                            }`}
                    >
                        By Month
                    </button>
                    <button
                        onClick={() => {
                            setFilterType('date');
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filterType === 'date'
                            ? 'bg-accent text-white'
                            : 'bg-background-secondary text-neutral-400 hover:text-neutral-200'
                            }`}
                    >
                        By Date
                    </button>
                </div>

                {/* Month Selector */}
                {filterType === 'month' && (
                    <div className="flex items-center justify-between bg-background-secondary rounded-lg px-3 py-2 mb-3">
                        <button
                            onClick={() => setSelectedMonth(selectedMonth.subtract(1, 'month'))}
                            className="p-1.5 hover:bg-background-tertiary rounded-lg transition-colors"
                        >
                            <ChevronLeft size={18} className="text-neutral-300" />
                        </button>
                        <span className="font-medium text-neutral-100">
                            {selectedMonth.format('MMMM YYYY')}
                        </span>
                        <button
                            onClick={() => setSelectedMonth(selectedMonth.add(1, 'month'))}
                            className="p-1.5 hover:bg-background-tertiary rounded-lg transition-colors"
                        >
                            <ChevronRight size={18} className="text-neutral-300" />
                        </button>
                    </div>
                )}

                {/* Date Selector */}
                {filterType === 'date' && (
                    <div className="flex items-center justify-between bg-background-secondary rounded-lg px-3 py-2 mb-3">
                        <button
                            onClick={() => setSelectedDate(selectedDate.subtract(1, 'day'))}
                            className="p-1.5 hover:bg-background-tertiary rounded-lg transition-colors"
                        >
                            <ChevronLeft size={18} className="text-neutral-300" />
                        </button>
                        <button
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="flex items-center gap-2 font-medium text-neutral-100 hover:text-accent transition-colors"
                        >
                            <Calendar size={16} />
                            {selectedDate.format('DD MMM YYYY')}
                        </button>
                        <button
                            onClick={() => setSelectedDate(selectedDate.add(1, 'day'))}
                            className="p-1.5 hover:bg-background-tertiary rounded-lg transition-colors"
                        >
                            <ChevronRight size={18} className="text-neutral-300" />
                        </button>
                    </div>
                )}

                {/* Date Picker Popup */}
                {filterType === 'date' && showDatePicker && (
                    <DatePickerInline
                        value={selectedDate}
                        onChange={(date) => {
                            setSelectedDate(date);
                            setShowDatePicker(false);
                        }}
                        onClose={() => setShowDatePicker(false)}
                    />
                )}

                {/* Payment Filter: All, Paid, Unpaid */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setPaymentFilter('all')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${paymentFilter === 'all'
                            ? 'bg-background-tertiary text-neutral-100 ring-1 ring-neutral-600'
                            : 'bg-background-secondary text-neutral-500 hover:text-neutral-300'
                            }`}
                    >
                        All
                        <span className="bg-background text-neutral-400 text-xs px-1.5 py-0.5 rounded">
                            {counts.all}
                        </span>
                    </button>
                    <button
                        onClick={() => setPaymentFilter('paid')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${paymentFilter === 'paid'
                            ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50'
                            : 'bg-background-secondary text-neutral-500 hover:text-neutral-300'
                            }`}
                    >
                        Paid
                        <span className="bg-background text-neutral-400 text-xs px-1.5 py-0.5 rounded">
                            {counts.paid}
                        </span>
                    </button>
                    <button
                        onClick={() => setPaymentFilter('unpaid')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${paymentFilter === 'unpaid'
                            ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50'
                            : 'bg-background-secondary text-neutral-500 hover:text-neutral-300'
                            }`}
                    >
                        Unpaid
                        <span className="bg-background text-neutral-400 text-xs px-1.5 py-0.5 rounded">
                            {counts.unpaid}
                        </span>
                    </button>
                </div>

                {/* Active Filters Summary */}
                {(filterType !== 'all' || paymentFilter !== 'all') && (
                    <div className="flex items-center gap-2 mb-4 text-xs">
                        <span className="text-neutral-500">Filters:</span>
                        {filterType === 'month' && (
                            <span className="bg-accent/20 text-accent px-2 py-1 rounded">
                                {selectedMonth.format('MMM YYYY')}
                            </span>
                        )}
                        {filterType === 'date' && (
                            <span className="bg-accent/20 text-accent px-2 py-1 rounded">
                                {selectedDate.format('DD MMM YYYY')}
                            </span>
                        )}
                        {paymentFilter !== 'all' && (
                            <span className={`px-2 py-1 rounded ${paymentFilter === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                {paymentFilter === 'paid' ? 'Paid' : 'Unpaid'}
                            </span>
                        )}
                        <button
                            onClick={() => {
                                setFilterType('all');
                                setPaymentFilter('all');
                            }}
                            className="text-neutral-400 hover:text-neutral-200 underline ml-auto"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="space-y-4">
                        <div className="h-6 w-32 skeleton rounded mb-3" />
                        <AuctionCardSkeleton />
                        <AuctionCardSkeleton />
                        <AuctionCardSkeleton />
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredAndGrouped.length === 0 && (
                    <EmptyState
                        title="No auctions found"
                        description={
                            searchQuery || filterType !== 'all' || paymentFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Create your first auction to get started'
                        }
                    />
                )}

                {/* Auction List */}
                {!isLoading && filteredAndGrouped.length > 0 && (
                    <div className="space-y-6">
                        {filteredAndGrouped.map(({ month, auctions: monthAuctions }) => (
                            <div key={month}>
                                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                                    {month} ({monthAuctions.length})
                                </h2>
                                <div className="space-y-3">
                                    {monthAuctions.map((auction) => (
                                        <div
                                            key={auction.id}
                                            onClick={() => handleAuctionClick(auction)}
                                            className="cursor-pointer"
                                        >
                                            <AuctionCard
                                                auction={auction}
                                                onMarkPaid={handleMarkPaid}
                                                isUpdating={updatingId === auction.id}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Auction Detail Modal */}
                <AuctionDetailModal
                    auction={selectedAuction}
                    isOpen={!!selectedAuction}
                    onClose={() => setSelectedAuction(null)}
                    onMarkPaid={handleMarkPaid}
                />

                {/* Confirm Dialog */}
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title="Confirm Payment"
                    message="Are you sure you want to mark this auction as paid? This action cannot be undone."
                    confirmLabel="Mark as Paid"
                    cancelLabel="Cancel"
                    onConfirm={confirmMarkPaid}
                    onCancel={() => setConfirmDialog({ isOpen: false, auctionId: null })}
                />

                <Toast
                    message={toast.message}
                    type={toast.type}
                    visible={toast.visible}
                    onClose={hideToast}
                />
            </div>
        </PullToRefresh>
    );
}

// Inline Date Picker Component
function DatePickerInline({
    value,
    onChange,
    onClose
}: {
    value: dayjs.Dayjs;
    onChange: (date: dayjs.Dayjs) => void;
    onClose: () => void;
}) {
    const [viewDate, setViewDate] = useState(value);
    const today = dayjs();

    const daysInMonth = viewDate.daysInMonth();
    const firstDayOfMonth = viewDate.startOf('month').day();

    const days = [];
    const prevMonthDays = viewDate.subtract(1, 'month').daysInMonth();

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        days.push({
            day: prevMonthDays - i,
            isCurrentMonth: false,
            date: viewDate.subtract(1, 'month').date(prevMonthDays - i),
        });
    }

    for (let i = 1; i <= daysInMonth; i++) {
        days.push({
            day: i,
            isCurrentMonth: true,
            date: viewDate.date(i),
        });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
        days.push({
            day: i,
            isCurrentMonth: false,
            date: viewDate.add(1, 'month').date(i),
        });
    }

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div className="bg-background-secondary border border-neutral-700 rounded-xl mb-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
                <button
                    onClick={() => setViewDate(viewDate.subtract(1, 'month'))}
                    className="p-1.5 hover:bg-background-tertiary rounded-lg transition-colors"
                >
                    <ChevronLeft size={18} className="text-neutral-300" />
                </button>
                <span className="font-semibold text-neutral-100">
                    {viewDate.format('MMMM YYYY')}
                </span>
                <button
                    onClick={() => setViewDate(viewDate.add(1, 'month'))}
                    className="p-1.5 hover:bg-background-tertiary rounded-lg transition-colors"
                >
                    <ChevronRight size={18} className="text-neutral-300" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 px-2 py-2 border-b border-neutral-800">
                {weekDays.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-neutral-500 py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 p-2">
                {days.map((item, index) => {
                    const isSelected = item.date.isSame(value, 'day');
                    const isToday = item.date.isSame(today, 'day');

                    return (
                        <button
                            key={index}
                            onClick={() => onChange(item.date)}
                            className={`
                h-9 w-full rounded-lg text-sm font-medium transition-all
                ${!item.isCurrentMonth ? 'text-neutral-600' : 'text-neutral-200'}
                ${isSelected ? 'bg-accent text-white' : 'hover:bg-background-tertiary'}
                ${isToday && !isSelected ? 'ring-1 ring-accent text-accent' : ''}
              `}
                        >
                            {item.day}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-700">
                <button
                    onClick={() => onChange(today)}
                    className="text-xs text-accent hover:text-accent-hover font-medium"
                >
                    Today
                </button>
                <button
                    onClick={onClose}
                    className="text-xs text-neutral-400 hover:text-neutral-200"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
