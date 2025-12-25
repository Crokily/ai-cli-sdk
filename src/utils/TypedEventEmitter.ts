import { EventEmitter } from "node:events";

type EventMap<TEvents> = {
  [K in keyof TEvents]: (...args: any[]) => void;
};

type Listener<T> = T extends (...args: infer A) => void ? (...args: A) => void : never;

type EventKey<TEvents extends EventMap<TEvents>> = keyof TEvents & (string | symbol);

export class TypedEventEmitter<TEvents extends EventMap<TEvents>> extends EventEmitter {
  override on<K extends EventKey<TEvents>>(event: K, listener: Listener<TEvents[K]>): this {
    return super.on(event, listener);
  }

  override once<K extends EventKey<TEvents>>(event: K, listener: Listener<TEvents[K]>): this {
    return super.once(event, listener);
  }

  override off<K extends EventKey<TEvents>>(event: K, listener: Listener<TEvents[K]>): this {
    return super.off(event, listener);
  }

  override emit<K extends EventKey<TEvents>>(event: K, ...args: Parameters<TEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
}
