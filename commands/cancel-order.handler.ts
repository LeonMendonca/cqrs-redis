import { pool } from "../shared/database/pg";
import { CommandHandler } from "../shared/bus/command-bus";
import { CancelOrderCommand } from "./cancel-order.command";

export class CancelOrderHandler
  implements CommandHandler<CancelOrderCommand, { success: boolean }>
{
  async execute(command: CancelOrderCommand) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { orderId } = command;

      const { rowCount } = await client.query(
        `
        UPDATE orders
        SET status = 'CANCELLED',
            updated_at = NOW()
        WHERE order_id = $1
        AND status != 'CANCELLED'
        `,
        [orderId]
      );

      if (rowCount === 0) {
        throw new Error("Order not found or already cancelled");
      }

      await client.query("COMMIT");

      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}