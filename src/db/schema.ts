import { pgTable, uuid, varchar, date, decimal, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const auctions = pgTable('auctions', {
    id: uuid('id').primaryKey().defaultRandom(),
    personName: varchar('person_name', { length: 255 }).notNull(),
    mobileNumber: varchar('mobile_number', { length: 20 }).notNull(),
    auctionDate: date('auction_date').notNull(),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    isPaid: boolean('is_paid').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const auctionItems = pgTable('auction_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    auctionId: uuid('auction_id').notNull().references(() => auctions.id, { onDelete: 'cascade' }),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    quantity: integer('quantity').notNull(),
    price: decimal('price', { precision: 12, scale: 2 }).notNull(),
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

export type Auction = typeof auctions.$inferSelect;
export type NewAuction = typeof auctions.$inferInsert;
export type AuctionItem = typeof auctionItems.$inferSelect;
export type NewAuctionItem = typeof auctionItems.$inferInsert;
