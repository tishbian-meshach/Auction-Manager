import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import type { Auction } from '../api';

const AUCTIONS_CACHE_KEY = 'cached_auctions';

export const storage = {
    async saveAuctions(auctions: Auction[]): Promise<void> {
        await Preferences.set({
            key: AUCTIONS_CACHE_KEY,
            value: JSON.stringify(auctions),
        });
    },

    async getAuctions(): Promise<Auction[] | null> {
        const { value } = await Preferences.get({ key: AUCTIONS_CACHE_KEY });
        if (value) {
            try {
                return JSON.parse(value);
            } catch {
                return null;
            }
        }
        return null;
    },

    async clearAuctions(): Promise<void> {
        await Preferences.remove({ key: AUCTIONS_CACHE_KEY });
    },
};

export const network = {
    async isOnline(): Promise<boolean> {
        const status = await Network.getStatus();
        return status.connected;
    },

    addListener(callback: (connected: boolean) => void) {
        return Network.addListener('networkStatusChange', (status) => {
            callback(status.connected);
        });
    },
};
