import { NavLink } from 'react-router-dom';
import { Plus, List } from 'lucide-react';

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-neutral-800 safe-bottom">
            <div className="flex items-center justify-around h-16 max-w-md mx-auto">
                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-lg transition-colors ${isActive ? 'text-accent' : 'text-neutral-400 hover:text-neutral-200'
                        }`
                    }
                >
                    <Plus size={22} />
                    <span className="text-xs font-medium">Add Auction</span>
                </NavLink>
                <NavLink
                    to="/auctions"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-lg transition-colors ${isActive ? 'text-accent' : 'text-neutral-400 hover:text-neutral-200'
                        }`
                    }
                >
                    <List size={22} />
                    <span className="text-xs font-medium">View Auctions</span>
                </NavLink>
            </div>
        </nav>
    );
}
