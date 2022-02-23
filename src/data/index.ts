import type {
  CardColour, Id, Item as Item_,
  Skill,
  UpgradeItem as UpgradeItem_,
  UpgradeRequirements as UpgradeRequirements_
} from "./common";
export type { Id, IdMap, Skill, CardColour } from "./common";
export { makeId } from "./common";

export type UpgradeRequirements = UpgradeRequirements_<Id<"item">>;
export type UpgradeItem = UpgradeItem_<Id<"item">>;

export type GameEvent = {
  id: Id<"event">,
  name: string,
  date: string,
}

export type EventAppearance = {
  event: Id<"event">,
  amount: number,
  kind: "lottery" | "shop" | "mission" | "quest",
}

export type ItemDrop = {
  area: string,
  quest: string,
  link: string,
  ap: number,
  ap_drop: number,
  drop: number,
}

export type Item = Item_ & {
  alwaysDisplay: boolean,
  events: Array<EventAppearance>,
  drops: Array<ItemDrop>,
}

/**
 * A servant within the nice_servant.json file. We don't actually use this
 * directly, we convert it to a UsefulServant which information in a more
 * accessible way.
 */
export type Servant = {
  id: Id<"servant">,
  name: string,
  rarity: number,
  ascensions: Array<string>,
  ascensionMaterials?: Array<UpgradeRequirements>,
  skillMaterials: Array<UpgradeRequirements>,
  skills: Array<Array<Skill>>,
  lvlMax: Array<number>,
  npType?: CardColour,

  webcrowId: number,
}

/**
 * Mapping of Rarity => List of grail applications. Each application specifies the number levels it adds to the /base/
 * and the QP cost.
 */
export type GrailCosts = Array<Array<{ add: number, qp: number }>>;

export type DataDump = {
  servants: Array<Servant>,
  items: Array<Item>,
  events: Array<GameEvent>,
  expGrowth: Array<number>,
  grailCosts: GrailCosts,
}

export enum Priority {
  High = "High",
  Medium = "Medium",
  Low = "Low",
  Unsummoned = "Unsummoned",
}

export type Target = {
  current?: number,
  target?: number,
}

/**
 * A servant owned by the player. This doesn't store any details of the servant
 * (such as skills), only details about an instance of the servant (such as
 * level).
 *
 * Owned servants are uniquely identified by a UUID instead of a the servant ID
 * - the UUID is guaranteed to be constant and (one would hope) unique, while
 * a servant ID isn't.
 */
export type OwnedServant = {
  uid: string,
  id: Id<"servant">,
  priority: Priority,
  level: Target,
  ascension: Target,
  skills: Array<Target>,
}

export type Filters = {
  maxed: boolean,
  priority: { [K in Priority]: boolean },
}
