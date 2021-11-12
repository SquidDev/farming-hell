import type { Id, IdMap } from ".";

export const byId = <T extends string>(a: Id<T>, b: Id<T>): number => {
  return a - b;
};

export const byPriority = <T extends { id: Id<M>, priority: number }, M extends string>(lookup: IdMap<T>) => (x: Id<M>, y: Id<M>): number =>
  lookup.get(x)!.priority - lookup.get(y)!.priority;
