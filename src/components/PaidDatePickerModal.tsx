import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';

interface PaidDatePickerModalProps {
    isOpen: boolean;
    onConfirm: (date: string) => void;
    onCancel: () => void;
}

export function PaidDatePickerModal({ isOpen, onConfirm, onCancel }: PaidDatePickerModalProps) {
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [viewDate, setViewDate] = useState(dayjs());
    const today = dayjs();

    if (!isOpen) return null;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={onCancel} />

            <div className="relative bg-background-secondary w-full max-w-sm rounded-2xl border border-neutral-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-700">
                    <h2 className="text-lg font-bold text-neutral-100">Select Paid Date</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
                    >
                        <X size={20} className="text-neutral-400" />
                    </button>
                </div>

                {/* Selected date display */}
                <div className="px-4 py-3 bg-green-500/10 border-b border-neutral-700">
                    <p className="text-sm text-neutral-400">Marking as paid on:</p>
                    <p className="text-lg font-bold text-green-400">
                        {selectedDate.format('DD MMM YYYY')}
                    </p>
                </div>

                {/* Month navigation */}
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

                {/* Week days header */}
                <div className="grid grid-cols-7 gap-1 px-2 py-2 border-b border-neutral-800">
                    {weekDays.map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-neutral-500 py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 p-2">
                    {days.map((item, index) => {
                        const isSelected = item.date.isSame(selectedDate, 'day');
                        const isToday = item.date.isSame(today, 'day');

                        return (
                            <button
                                key={index}
                                onClick={() => setSelectedDate(item.date)}
                                className={`
                                    h-9 w-full rounded-lg text-sm font-medium transition-all
                                    ${!item.isCurrentMonth ? 'text-neutral-600' : 'text-neutral-200'}
                                    ${isSelected ? 'bg-green-500 text-white' : 'hover:bg-background-tertiary'}
                                    ${isToday && !isSelected ? 'ring-1 ring-green-500 text-green-400' : ''}
                                `}
                            >
                                {item.day}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-700">
                    <button
                        onClick={() => {
                            setSelectedDate(today);
                            setViewDate(today);
                        }}
                        className="text-sm text-green-400 hover:text-green-300 font-medium transition-colors"
                    >
                        Today
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 bg-background-tertiary rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(selectedDate.format('YYYY-MM-DD'))}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors shadow-lg shadow-green-500/20"
                        >
                            Mark as Paid
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
