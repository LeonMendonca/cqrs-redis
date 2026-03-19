import { redis } from "../shared/database/redis";
import { pool } from "../shared/database/pg";
import { randomUUID } from "node:crypto";
import { STREAM, GROUP } from "../constants/redis-stream";

const CONSUMER = `order_consumer_${randomUUID()}`

async function consumer() {
    console.log("Redis Projection Worker started...");
    while (true) {
        try {
            const response = await redis.xreadgroup(
                "GROUP",
                GROUP,
                CONSUMER,
                "COUNT",
                10,
                "BLOCK",
                5000,
                "STREAMS",
                STREAM,
                ">"
            ) as any;

            if (!response) continue;

            console.log(response);

            for (const [, messages] of response) {
                for (const [id, fields] of messages) {
                    const parsed = parseFields(fields);

                    if (parsed.eventType === "ORDER_CREATED") {
                        await handleOrderCreated(parsed.orderId);
                    }

                    await redis.xack(STREAM, GROUP, id);
                }
            }
        } catch (err) {
            console.error("Worker error:", err);
        }
    }

}

function parseFields(fields: string[]) {
  const result: any = {};
  for (let i = 0; i < fields.length; i += 2) {
    result[fields[i]] = fields[i + 1];
  }
  return result;
}

async function handleOrderCreated(orderId: string) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      INSERT INTO order_summaries
        (order_id, user_id, user_name, total_items, total_amount, status, created_at)
      SELECT
        o.order_id,
        o.user_id,
        u.full_name,
        COUNT(oi.order_item_id),
        o.total_amount,
        o.status,
        o.created_at
      FROM orders o
      JOIN users u ON u.user_id = o.user_id
      JOIN order_items oi ON oi.order_id = o.order_id
      WHERE o.order_id = $1
      GROUP BY o.order_id, u.full_name
      `,
      [orderId]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

consumer();