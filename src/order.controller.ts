import { Router, Request, Response, NextFunction } from "express";

import { commandBus } from "../shared/bus/command-bus";
import { queryBus } from "../shared/bus/query-bus";

import { CreateOrderCommand } from "../commands/create-order.command";
import { CancelOrderCommand } from "../commands/cancel-order.command";

import { GetOrderQuery } from "../queries/get-order.query";
import { ListOrdersQuery } from "../queries/list-orders.query";
import { redis } from "../shared/database/redis";
import { STREAM } from "../constants/redis-stream";

export const orderRouter = Router();

/**
 * Create Order (Write Side)
 */
orderRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, items } = req.body;

      const command = new CreateOrderCommand(userId, items);

      const result = await commandBus.execute(command);
      await redis.xadd(STREAM, "*", "eventType", "ORDER_CREATED", "orderId", `${(result as any).orderId}`)

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Cancel Order (Write Side)
 */
orderRouter.patch(
  "/:orderId/cancel",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;

      const command = new CancelOrderCommand(orderId as string);

      const result = await commandBus.execute(command);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Single Order (Read Side)
 */
orderRouter.get(
  "/:orderId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;

      const query = new GetOrderQuery(orderId as string);

      const result = await queryBus.execute(query);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * List Orders (Read Side)
 */
orderRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, status } = req.query;

      const query = new ListOrdersQuery(
        userId as string | undefined,
        status as string | undefined
      );

      const result = await queryBus.execute(query);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);