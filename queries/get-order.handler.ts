import { pool } from "../shared/database/pg";
import { QueryHandler } from "../shared/bus/query-bus";
import { GetOrderQuery } from "./get-order.query";

export class GetOrderHandler
  implements QueryHandler<GetOrderQuery, any>
{
  async execute(query: GetOrderQuery) {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM order_summaries
      WHERE order_id = $1
      `,
      [query.orderId]
    );

    if (rows.length === 0) {
      throw new Error("Order not found");
    }

    return rows[0];
  }
}