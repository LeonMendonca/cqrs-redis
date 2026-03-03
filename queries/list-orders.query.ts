import { Query } from "../shared/bus/query-bus";

export class ListOrdersQuery implements Query<any[]> {
  constructor(
    public readonly userId?: string,
    public readonly status?: string
  ) {}
}