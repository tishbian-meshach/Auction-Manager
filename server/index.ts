import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { db } from '../src/db/client';
import { auctions, auctionItems } from '../src/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Create auction with items
app.post('/api/auctions', async (req, res) => {
    try {
        const { personName, mobileNumber, auctionDate, items, isPaid } = req.body;

        // Validation
        if (!personName || !mobileNumber || !auctionDate || !items || items.length === 0) {
            return res.status(400).json({
                error: 'Missing required fields: personName, mobileNumber, auctionDate, and items are required'
            });
        }

        // Validate items
        for (const item of items) {
            if (!item.itemName || item.quantity <= 0 || item.price <= 0) {
                return res.status(400).json({
                    error: 'Each item must have itemName, quantity > 0, and price > 0'
                });
            }
        }

        // Calculate total amount
        const totalAmount = items.reduce((sum: number, item: { quantity: number; price: number }) =>
            sum + (item.quantity * item.price), 0
        );

        // Insert auction
        const [newAuction] = await db.insert(auctions).values({
            personName,
            mobileNumber,
            auctionDate,
            totalAmount: totalAmount.toFixed(2),
            isPaid: isPaid || false,
        }).returning();

        // Insert items
        const itemsToInsert = items.map((item: { itemName: string; quantity: number; price: number }) => ({
            auctionId: newAuction.id,
            itemName: item.itemName,
            quantity: item.quantity,
            price: item.price.toFixed(2),
        }));

        await db.insert(auctionItems).values(itemsToInsert);

        // Fetch complete auction with items
        const completeAuction = await db.query.auctions.findFirst({
            where: eq(auctions.id, newAuction.id),
            with: { items: true },
        });

        res.status(201).json(completeAuction);
    } catch (error) {
        console.error('Error creating auction:', error);
        res.status(500).json({ error: 'Failed to create auction' });
    }
});

// Get auctions with optional month/year filter
app.get('/api/auctions', async (req, res) => {
    try {
        const { month, year } = req.query;

        let result;

        if (month && year) {
            // Filter by month and year
            const monthNum = parseInt(month as string);
            const yearNum = parseInt(year as string);

            if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
                return res.status(400).json({ error: 'Invalid month or year' });
            }

            result = await db.query.auctions.findMany({
                where: sql`EXTRACT(MONTH FROM ${auctions.auctionDate}) = ${monthNum} AND EXTRACT(YEAR FROM ${auctions.auctionDate}) = ${yearNum}`,
                with: { items: true },
                orderBy: (auctions, { desc }) => [desc(auctions.auctionDate)],
            });
        } else {
            // Get all auctions
            result = await db.query.auctions.findMany({
                with: { items: true },
                orderBy: (auctions, { desc }) => [desc(auctions.auctionDate)],
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Error fetching auctions:', error);
        res.status(500).json({ error: 'Failed to fetch auctions' });
    }
});

// Mark auction as paid
app.patch('/api/auctions/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Auction ID is required' });
        }

        const [updatedAuction] = await db
            .update(auctions)
            .set({ isPaid: true })
            .where(eq(auctions.id, id))
            .returning();

        if (!updatedAuction) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        res.json(updatedAuction);
    } catch (error) {
        console.error('Error updating auction:', error);
        res.status(500).json({ error: 'Failed to update auction' });
    }
});

const HOST = '0.0.0.0';

if (process.env.NODE_ENV !== 'production') {
    app.listen(Number(PORT), HOST, () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
        console.log(`Local network access: http://<YOUR_IP>:${PORT}`);
    });
}
