import { Command } from "../shared/bus/command-bus";

export class CancelOrderCommand implements Command<{ success: boolean }> {
  constructor(public readonly orderId: string) {}
}