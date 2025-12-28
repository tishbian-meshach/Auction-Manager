// Use relative paths for web (works with Vite proxy), production URL for mobile (Capacitor)
const isNativeApp = typeof (window as any).Capacitor !== 'undefined';
const API_BASE_URL = isNativeApp ? 'https://auction-manager-ten.vercel.app' : '';

export interface AuctionItem {
    id?: string;
    auctionId?: string;
    itemName: string;
    quantity: number;
    price: number;
}

export interface Auction {
    id: string;
    personName: string;
    mobileNumber: string;
    auctionDate: string;
    totalAmount: string;
    isPaid: boolean;
    createdAt: string;
    items: AuctionItem[];
}

export interface CreateAuctionPayload {
    personName: string;
    mobileNumber: string;
    auctionDate: string;
    items: Omit<AuctionItem, 'id' | 'auctionId'>[];
    isPaid: boolean;
}

export const api = {
    async createAuction(data: CreateAuctionPayload): Promise<Auction> {
        const response = await fetch(`${API_BASE_URL}/api/auctions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create auction');
        }

        return response.json();
    },

    async getAuctions(month?: number, year?: number): Promise<Auction[]> {
        const params = new URLSearchParams();
        if (month) params.append('month', month.toString());
        if (year) params.append('year', year.toString());

        const url = `${API_BASE_URL}/api/auctions${params.toString() ? `?${params}` : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch auctions');
        }

        return response.json();
    },

    async markAsPaid(id: string): Promise<Auction> {
        const response = await fetch(`${API_BASE_URL}/api/auctions/${id}/pay`, {
            method: 'PATCH',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update auction');
        }

        return response.json();
    },

    async deleteAuction(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/auctions/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete auction');
        }
    },

    async updateAuction(id: string, data: CreateAuctionPayload): Promise<Auction> {
        const response = await fetch(`${API_BASE_URL}/api/auctions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update auction');
        }

        return response.json();
    },
};
