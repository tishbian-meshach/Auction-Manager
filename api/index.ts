import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, decimal, boolean, timestamp, uuid, integer, date } from 'drizzle-orm/pg-core';
import { relations, eq, sql } from 'drizzle-orm';

// Schema definitions (inline to avoid import path issues)
export const auctions = pgTable('auctions', {
    id: uuid('id').defaultRandom().primaryKey(),
    personName: text('person_name').notNull(),
    mobileNumber: text('mobile_number').notNull(),
    auctionDate: date('auction_date').notNull(),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    isPaid: boolean('is_paid').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auctionItems = pgTable('auction_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    auctionId: uuid('auction_id').references(() => auctions.id).notNull(),
    itemName: text('item_name').notNull(),
    quantity: integer('quantity').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
});

export const auctionsRelations = relations(auctions, ({ many }) => ({
    items: many(auctionItems),
}));

export const auctionItemsRelations = relations(auctionItems, ({ one }) => ({
    auction: one(auctions, {
        fields: [auctionItems.auctionId],
        references: [auctions.id],
    }),
}));

// Database client
const sqlClient = neon(process.env.DATABASE_URL || '');

// Schema object for Drizzle - include tables AND relations for db.query to work
const schema = {
    auctions,
    auctionItems,
    auctionsRelations,
    auctionItemsRelations
};

// Drizzle instance with relations for queries
const db = drizzle(sqlClient, { schema });

// Express app
const app = express();

// Allow all origins for mobile app (Capacitor) support
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasDbUrl: !!process.env.DATABASE_URL });
});

// Get auctions
app.get('/api/auctions', async (req, res) => {
    try {
        const { month, year } = req.query;
        let result;

        if (month && year) {
            const monthNum = parseInt(month as string);
            const yearNum = parseInt(year as string);

            if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
                return res.status(400).json({ error: 'Invalid month or year' });
            }

            result = await db.query.auctions.findMany({
                where: sql`EXTRACT(MONTH FROM ${auctions.auctionDate}) = ${monthNum} AND EXTRACT(YEAR FROM ${auctions.auctionDate}) = ${yearNum}`,
                with: { items: true },
                orderBy: (auctions, { desc }) => [desc(auctions.auctionDate), desc(auctions.createdAt)],
            });
        } else {
            result = await db.query.auctions.findMany({
                with: { items: true },
                orderBy: (auctions, { desc }) => [desc(auctions.auctionDate), desc(auctions.createdAt)],
            });
        }

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching auctions:', error);
        res.status(500).json({ error: 'Failed to fetch auctions', message: error.message });
    }
});

// Create auction
app.post('/api/auctions', async (req, res) => {
    try {
        console.log('POST /api/auctions - Request body:', JSON.stringify(req.body));

        const { personName, mobileNumber, auctionDate, items, isPaid } = req.body;

        if (!personName || !mobileNumber || !auctionDate || !items || items.length === 0) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        const totalAmount = items.reduce((sum: number, item: { quantity: number; price: number }) =>
            sum + parseFloat(String(item.price)), 0
        );

        console.log('Inserting auction...');
        const [newAuction] = await db.insert(auctions).values({
            personName,
            mobileNumber,
            auctionDate: String(auctionDate).split('T')[0],
            totalAmount: totalAmount.toFixed(2),
            isPaid: isPaid || false,
        }).returning();
        console.log('Auction inserted:', newAuction.id);

        const itemsToInsert = items.map((item: { itemName: string; quantity: number; price: number }) => ({
            auctionId: newAuction.id,
            itemName: item.itemName,
            quantity: item.quantity,
            price: parseFloat(String(item.price)).toFixed(2),
        }));

        console.log('Inserting items...');
        const insertedItems = await db.insert(auctionItems).values(itemsToInsert).returning();
        console.log('Items inserted:', insertedItems.length);

        // Return the auction with items directly
        res.status(201).json({
            ...newAuction,
            items: insertedItems,
        });
    } catch (error: any) {
        console.error('Error creating auction:', error);
        res.status(500).json({ error: 'Failed to create auction', message: error.message, stack: error.stack });
    }
});

// Mark as paid
app.patch('/api/auctions/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;

        const [updatedAuction] = await db
            .update(auctions)
            .set({ isPaid: true })
            .where(eq(auctions.id, id))
            .returning();

        if (!updatedAuction) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        res.json(updatedAuction);
    } catch (error: any) {
        console.error('Error updating auction:', error);
        res.status(500).json({ error: 'Failed to update auction', message: error.message });
    }
});

// Delete auction
app.delete('/api/auctions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // First delete related items (foreign key constraint)
        await db.delete(auctionItems).where(eq(auctionItems.auctionId, id));

        // Then delete the auction
        const [deletedAuction] = await db
            .delete(auctions)
            .where(eq(auctions.id, id))
            .returning();

        if (!deletedAuction) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        res.json({ success: true, message: 'Auction deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting auction:', error);
        res.status(500).json({ error: 'Failed to delete auction', message: error.message });
    }
});

// Update auction
app.put('/api/auctions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { personName, mobileNumber, auctionDate, items, isPaid } = req.body;

        if (!personName || !mobileNumber || !auctionDate || !items || items.length === 0) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Calculate new total
        const totalAmount = items.reduce((sum: number, item: { price: number }) =>
            sum + parseFloat(String(item.price)), 0
        );

        // Update auction
        const [updatedAuction] = await db
            .update(auctions)
            .set({
                personName,
                mobileNumber,
                auctionDate: String(auctionDate).split('T')[0],
                totalAmount: totalAmount.toFixed(2),
                isPaid: isPaid || false,
            })
            .where(eq(auctions.id, id))
            .returning();

        if (!updatedAuction) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        // Delete old items and insert new ones
        await db.delete(auctionItems).where(eq(auctionItems.auctionId, id));

        const itemsToInsert = items.map((item: { itemName: string; quantity: number; price: number }) => ({
            auctionId: id,
            itemName: item.itemName,
            quantity: item.quantity,
            price: parseFloat(String(item.price)),
        }));

        const insertedItems = await db.insert(auctionItems).values(itemsToInsert).returning();

        res.json({
            ...updatedAuction,
            items: insertedItems,
        });
    } catch (error: any) {
        console.error('Error updating auction:', error);
        res.status(500).json({ error: 'Failed to update auction', message: error.message });
    }
});

export default app;
