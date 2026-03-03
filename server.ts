import { app } from "./app";
import dotenv from "dotenv";
import { pool } from "./shared/database/pg";
import { Server } from "node:http";

import { commandBus } from "./shared/bus/command-bus";

import { CreateOrderCommand } from "./commands/create-order.command";
import { CreateOrderHandler } from "./commands/create-order.handler";

import { CancelOrderCommand } from "./commands/cancel-order.command";
import { CancelOrderHandler } from "./commands/cancel-order.handler";

import { GetOrderQuery } from "./queries/get-order.query";
import { GetOrderHandler } from "./queries/get-order.handler";

import { ListOrdersQuery } from "./queries/list-orders.query";
import { ListOrdersHandler } from "./queries/list-orders.handler";

dotenv.config();

const PORT = process.env.PORT || 4000;

const gracefulShutdown = (server: Server) => {
  console.log('Initiating graceful shutdown...');
  server.close(async () => {
    console.log("Waiting for PG to shutdown...", pool.waitingCount)
    try {
      await pool.end();
      console.log('PostgreSQL connection pool ended.');
      process.exit(0);
    } catch (err) {
      console.error('Error ending PostgreSQL pool', err);
      process.exit(1);
    }
  })

  //Force shutdown
  setTimeout(() => {
    console.error("Graceful shutdown timed out. Forcing exit");
    process.exit(1);
  }, 11000);
}

function register() {
  commandBus.register(CreateOrderCommand, new CreateOrderHandler());
  commandBus.register(CancelOrderCommand, new CancelOrderHandler());

  commandBus.register(GetOrderQuery, new GetOrderHandler());
  commandBus.register(ListOrdersQuery, new ListOrdersHandler());
}

async function bootstrap() {
  try {
    register();
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => gracefulShutdown(server));

    process.on("SIGINT", () => gracefulShutdown(server));

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();