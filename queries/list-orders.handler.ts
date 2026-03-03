import { pool } from "../shared/database/pg";
import { QueryHandler } from "../shared/bus/query-bus";
import { ListOrdersQuery } from "./list-orders.query";

export class ListOrdersHandler
  implements QueryHandler<ListOrdersQuery, any[]>
{
  async execute(query: ListOrdersQuery) {
    const conditions: string[] = [];
    const values: any[] = [];

    if (query.userId) {
      values.push(query.userId);
      conditions.push(`user_id = $${values.length}`);
    }

    if (query.status) {
      values.push(query.status);
      conditions.push(`status = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const { rows } = await pool.query(
      `
      SELECT *
      FROM order_summaries
      ${whereClause}
      ORDER BY created_at DESC
      `,
      values
    );

    return rows;
  }
}