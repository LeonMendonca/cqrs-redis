export interface Query<R = any> {}

export interface QueryHandler<Q extends Query<R>, R = any> {
  execute(query: Q): Promise<R>;
}

export class QueryBus {
  private handlers = new Map<string, QueryHandler<any, any>>();

  register<Q extends Query<R>, R>(
    queryType: new (...args: any[]) => Q,
    handler: QueryHandler<Q, R>
  ) {
    this.handlers.set(queryType.name, handler);
  }

  async execute<Q extends Query<R>, R>(query: Q): Promise<R> {
    const handler = this.handlers.get(query.constructor.name);

    if (!handler) {
      throw new Error(
        `No handler registered for query: ${query.constructor.name}`
      );
    }

    return handler.execute(query);
  }
}

export const queryBus = new QueryBus();