import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import { api, type CreateAuctionPayload } from '../api';
import { Toast } from '../components/Toast';
import { DatePicker } from '../components/DatePicker';
import { useToast } from '../hooks/useToast';

interface ItemInput {
    id: string;
    itemName: string;
    quantity: string;
    price: string;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export function AddAuction() {
    const [personName, setPersonName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [auctionDate, setAuctionDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [isPaid, setIsPaid] = useState(false);
    const [items, setItems] = useState<ItemInput[]>([
        { id: generateId(), itemName: '', quantity: '', price: '' },
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { toast, showToast, hideToast } = useToast();

    const addItem = () => {
        setItems([...items, { id: generateId(), itemName: '', quantity: '', price: '' }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof ItemInput, value: string) => {
        setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.price) || 0;
            return sum + quantity * price;
        }, 0);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!personName.trim()) {
            newErrors.personName = 'Person name is required';
        }

        if (!mobileNumber.trim()) {
            newErrors.mobileNumber = 'Mobile number is required';
        } else if (!/^\d{10}$/.test(mobileNumber.trim())) {
            newErrors.mobileNumber = 'Enter a valid 10-digit mobile number';
        }

        if (!auctionDate) {
            newErrors.auctionDate = 'Auction date is required';
        }

        const validItems = items.filter(
            (item) => item.itemName.trim() && parseFloat(item.quantity) > 0 && parseFloat(item.price) > 0
        );

        if (validItems.length === 0) {
            newErrors.items = 'Add at least one valid item';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);

        try {
            const payload: CreateAuctionPayload = {
                personName: personName.trim(),
                mobileNumber: mobileNumber.trim(),
                auctionDate,
                isPaid,
                items: items
                    .filter(
                        (item) =>
                            item.itemName.trim() && parseFloat(item.quantity) > 0 && parseFloat(item.price) > 0
                    )
                    .map((item) => ({
                        itemName: item.itemName.trim(),
                        quantity: parseInt(item.quantity, 10),
                        price: parseFloat(item.price),
                    })),
            };

            await api.createAuction(payload);

            showToast('Auction created successfully', 'success');

            // Reset form
            setPersonName('');
            setMobileNumber('');
            setAuctionDate(dayjs().format('YYYY-MM-DD'));
            setIsPaid(false);
            setItems([{ id: generateId(), itemName: '', quantity: '', price: '' }]);
            setErrors({});
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to create auction', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen pb-24 px-4 pt-6" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
            <h1 className="text-2xl font-bold text-neutral-100 mb-6">Add Auction</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Person Name */}
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Person Name
                    </label>
                    <input
                        type="text"
                        value={personName}
                        onChange={(e) => setPersonName(e.target.value)}
                        className={`input ${errors.personName ? 'border-danger' : ''}`}
                        placeholder="Enter person name"
                    />
                    {errors.personName && (
                        <p className="text-sm text-danger mt-1">{errors.personName}</p>
                    )}
                </div>

                {/* Mobile Number */}
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Mobile Number
                    </label>
                    <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className={`input ${errors.mobileNumber ? 'border-danger' : ''}`}
                        placeholder="Enter 10-digit mobile number"
                        inputMode="numeric"
                    />
                    {errors.mobileNumber && (
                        <p className="text-sm text-danger mt-1">{errors.mobileNumber}</p>
                    )}
                </div>

                {/* Auction Date - Custom DatePicker */}
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Auction Date
                    </label>
                    <DatePicker
                        value={auctionDate}
                        onChange={setAuctionDate}
                        error={!!errors.auctionDate}
                    />
                    {errors.auctionDate && (
                        <p className="text-sm text-danger mt-1">{errors.auctionDate}</p>
                    )}
                </div>

                {/* Items Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-neutral-300">Items</label>
                        <button type="button" onClick={addItem} className="btn btn-ghost text-sm py-1.5">
                            <Plus size={16} />
                            Add Item
                        </button>
                    </div>

                    {errors.items && <p className="text-sm text-danger mb-3">{errors.items}</p>}

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={item.id} className="card p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-neutral-500 font-medium">
                                        Item {index + 1}
                                    </span>
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="p-1.5 text-neutral-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <input
                                    type="text"
                                    value={item.itemName}
                                    onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                                    className="input text-sm py-2.5"
                                    placeholder="Item name"
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                        className="input text-sm py-2.5"
                                        placeholder="Quantity"
                                        inputMode="numeric"
                                        min="1"
                                    />
                                    <input
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                        className="input text-sm py-2.5"
                                        placeholder="Price"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total Amount */}
                <div className="card bg-accent/10 border-accent/30">
                    <div className="flex items-center justify-between">
                        <span className="text-neutral-300 font-medium">Total Amount</span>
                        <span className="text-2xl font-bold text-accent">
                            {formatCurrency(calculateTotal())}
                        </span>
                    </div>
                </div>

                {/* Payment Status */}
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-3">
                        Payment Status
                    </label>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsPaid(true)}
                            className={`flex-1 py-3 rounded-lg font-medium transition-all ${isPaid
                                ? 'bg-success text-white'
                                : 'bg-background-tertiary text-neutral-400 hover:text-neutral-200'
                                }`}
                        >
                            Paid
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsPaid(false)}
                            className={`flex-1 py-3 rounded-lg font-medium transition-all ${!isPaid
                                ? 'bg-danger text-white'
                                : 'bg-background-tertiary text-neutral-400 hover:text-neutral-200'
                                }`}
                        >
                            Not Paid
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary w-full py-3.5 text-base"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Auction'
                    )}
                </button>
            </form>

            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onClose={hideToast}
            />
        </div>
    );
}
