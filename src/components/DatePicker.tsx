import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import dayjs from 'dayjs';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    error?: boolean;
}

export function DatePicker({ value, onChange, error }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(dayjs(value || undefined));
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedDate = value ? dayjs(value) : null;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = viewDate.daysInMonth();
    const firstDayOfMonth = viewDate.startOf('month').day();
    const today = dayjs();

    const days = [];
    const prevMonthDays = viewDate.subtract(1, 'month').daysInMonth();

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        days.push({
            day: prevMonthDays - i,
            isCurrentMonth: false,
            date: viewDate.subtract(1, 'month').date(prevMonthDays - i),
        });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({
            day: i,
            isCurrentMonth: true,
            date: viewDate.date(i),
        });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
        days.push({
            day: i,
            isCurrentMonth: false,
            date: viewDate.add(1, 'month').date(i),
        });
    }

    const handleDateSelect = (date: dayjs.Dayjs) => {
        onChange(date.format('YYYY-MM-DD'));
        setIsOpen(false);
    };

    const goToPrevMonth = () => setViewDate(viewDate.subtract(1, 'month'));
    const goToNextMonth = () => setViewDate(viewDate.add(1, 'month'));
    const goToToday = () => {
        setViewDate(today);
        onChange(today.format('YYYY-MM-DD'));
        setIsOpen(false);
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`input flex items-center justify-between cursor-pointer ${error ? 'border-danger' : ''
                    }`}
            >
                <span className={selectedDate ? 'text-neutral-100' : 'text-neutral-500'}>
                    {selectedDate ? selectedDate.format('DD MMM YYYY') : 'Select date'}
                </span>
                <Calendar size={18} className="text-neutral-400" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 left-0 right-0 bg-background-secondary border border-neutral-700 rounded-xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
                        <button
                            type="button"
                            onClick={goToPrevMonth}
                            className="p-1.5 hover:bg-background-tertiary rounded-lg transition-colors"
                        >
                            <ChevronLeft size={18} className="text-neutral-300" />
                        </button>
                        <span className="font-semibold text-neutral-100">
                            {viewDate.format('MMMM YYYY')}
                        </span>
                        <button
                            type="button"
                            onClick={goToNextMonth}
                            className="p-1.5 hover:bg-background-tertiary rounded-lg transition-colors"
                        >
                            <ChevronRight size={18} className="text-neutral-300" />
                        </button>
                    </div>

                    {/* Week days header */}
                    <div className="grid grid-cols-7 gap-1 px-2 py-2 border-b border-neutral-800">
                        {weekDays.map((day) => (
                            <div
                                key={day}
                                className="text-center text-xs font-medium text-neutral-500 py-1"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1 p-2">
                        {days.map((item, index) => {
                            const isSelected = selectedDate && item.date.isSame(selectedDate, 'day');
                            const isToday = item.date.isSame(today, 'day');

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleDateSelect(item.date)}
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

                    {/* Footer */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-700 bg-background/50">
                        <button
                            type="button"
                            onClick={() => {
                                onChange('');
                                setIsOpen(false);
                            }}
                            className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={goToToday}
                            className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
