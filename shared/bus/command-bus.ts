export interface Command<R = any> {}

export interface CommandHandler<C extends Command<R>, R = any> {
  execute(command: C): Promise<R>;
}

export class CommandBus {
  private handlers = new Map<string, CommandHandler<any, any>>();

  register<C extends Command<R>, R>(
    commandType: new (...args: any[]) => C,
    handler: CommandHandler<C, R>
  ) {
    this.handlers.set(commandType.name, handler);
  }

  async execute<C extends Command<R>, R>(command: C): Promise<R> {
    const handler = this.handlers.get(command.constructor.name);

    if (!handler) {
      throw new Error(
        `No handler registered for command: ${command.constructor.name}`
      );
    }

    return handler.execute(command);
  }
}

export const commandBus = new CommandBus();