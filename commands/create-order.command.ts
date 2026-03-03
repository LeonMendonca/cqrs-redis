import { Command } from "../shared/bus/command-bus";

export interface CreateOrderItemDTO {
  itemId: string;
  quantity: number;
}

export class CreateOrderCommand implements Command<{ orderId: string }> {
  constructor(
    public readonly userId: string,
    public readonly items: CreateOrderItemDTO[]
  ) {}
}