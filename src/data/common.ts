/**
 * Common type definitions. These shouldn't beimported directly outside of the
 * data package.
 */


const IdKind = Symbol("Brand");

/**
 * IDs provide a type-safe way to identify a particular game object. Each ID is
 * tagged with a type (such as servant or item) and can only be used with
 * compatible IDs.
 */
export type Id<T extends string> = number & { [IdKind]: T };

/** Construct an ID for a specific kind. */
export const makeId = <T extends string>(_kind: T, value: number): Id<T> => value as Id<T>;

/** A lookup of IDs to their original entry. */
export type IdMap<T extends { id: Id<string> }> = Map<T["id"], T>;

export type CardColour = "arts" | "quick" | "buster";

/** An obtainable item. */
export type Item = {
  id: Id<"item">,
  name: string,
  icon: string,
  background: string,
  priority: number,
};

/** An item used as part of an upgrade (skill, ascension and costume unlock). */
export type UpgradeItem<I> = {
  item: I,
  amount: number,
};

/** All requirements for an upgrade. */
export type UpgradeRequirements<I> = {
  items: Array<UpgradeItem<I>>,
  qp: number,
};

/** A skill which is usable by a servant. */
export type Skill = {
  id: Id<"skill">,
  num: number,
  name: string,
  detail: string,
  icon: string,
};
