import { Query } from "../shared/bus/query-bus";

export class GetOrderQuery implements Query<any> {
  constructor(public readonly orderId: string) {}
}