import { pool } from "../shared/database/pg";
import { CommandHandler } from "../shared/bus/command-bus";
import { CreateOrderCommand } from "./create-order.command";
import { randomUUID } from "crypto";

export class CreateOrderHandler
  implements CommandHandler<CreateOrderCommand, { orderId: string }>
{
  async execute(command: CreateOrderCommand) {
    const client = await pool.connect();

    try {
      const { userId, items } = command;

      if (!items || items.length === 0) {
        throw new Error("Order must contain at least one item");
      }

      await client.query("BEGIN");

      const orderId = randomUUID();

      // Lock items FOR UPDATE to prevent race condition
      const itemIds = items.map((i) => i.itemId);

      const { rows: dbItems } = await client.query(
        `
        SELECT item_id, name, price, stock_quantity
        FROM items
        WHERE item_id = ANY($1::uuid[])
        FOR UPDATE
        `,
        [itemIds]
      );

      if (dbItems.length !== items.length) {
        throw new Error("One or more items not found");
      }

      let totalAmount = 0;

      for (const inputItem of items) {
        const dbItem = dbItems.find(
          (i) => i.item_id === inputItem.itemId
        );

        if (!dbItem) {
          throw new Error("Invalid item");
        }

        if (dbItem.stock_quantity < inputItem.quantity) {
          throw new Error(
            `Insufficient stock for item ${dbItem.name}`
          );
        }

        totalAmount += Number(dbItem.price) * inputItem.quantity;
      }

      // Insert order
      await client.query(
        `
        INSERT INTO orders (order_id, user_id, total_amount, status)
        VALUES ($1, $2, $3, 'PENDING')
        `,
        [orderId, userId, totalAmount]
      );

      // Insert order items + decrease stock
      for (const inputItem of items) {
        const dbItem = dbItems.find(
          (i) => i.item_id === inputItem.itemId
        );

        await client.query(
          `
          INSERT INTO order_items (order_item_id, order_id, item_id, quantity, price_at_purchase)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [
            randomUUID(),
            orderId,
            inputItem.itemId,
            inputItem.quantity,
            dbItem.price,
          ]
        );

        await client.query(
          `
          UPDATE items
          SET stock_quantity = stock_quantity - $1
          WHERE item_id = $2
          `,
          [inputItem.quantity, inputItem.itemId]
        );
      }

      await client.query("COMMIT");

      return { orderId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}