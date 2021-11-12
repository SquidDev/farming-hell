/**
 * Type definitions exclusive to the atlas academy data dump.
 *
 * These are only used by bin/extract-data to convert into a more compact
 * format.
 */

import type { CardColour, Id, Item as Item_, Skill, UpgradeRequirements } from "./common";


export type AtlasItem = Item_ & {
  individuality: Array<{ id: number, name: number }>,
}

/** A noble phantasm usable by a servant. */
export type NoblePhantasm = {
  id: Id<"noblePhantasm">,
  num: number,
  card: CardColour,
};


/**
 * A servant within the nice_servant.json file. We don't actually use this
 * directly, we convert it to a UsefulServant which information in a more
 * accessible way.
 */
export type AtlasServant = {
  id: Id<"servant">,
  name: string,
  type: string,
  rarity: number,
  extraAssets: {
    faces: {
      /** A mapping containing keys "1".."4" where each  */
      ascension: { [key: string]: string },
    },
  },

  /** Materials required to ascend. Contains "0".."3". */
  ascensionMaterials: { [key: string]: UpgradeRequirements<AtlasItem> },

  /** Materials required to upgrade skills. Contains "1".."9". */
  skillMaterials: { [key: string]: UpgradeRequirements<AtlasItem> },
  skills?: Array<Skill>,
  expGrowth: Array<number>,
  noblePhantasms: Array<NoblePhantasm>,

  ascensionAdd: {
    lvMax: {
      ascension: { [key: number]: number },
    },
  },
}

export type EventSummary = {
  id: Id<"event">,
  name: string,
  startedAt: number,
  finishedAt: number,
}

export type Reward = {
  objectId: Id<"item">,
  num: number,
}

export type AtlasEvent = {
  warIds: Array<Id<"war">>,
  shop: Array<{
    targetIds: Array<Id<"item">>,
    limitNum: number,
  }>,
  lotteries: Array<{
    boxes: Array<{
      boxIndex: number,
      maxNum: number,
      gifts: Array<Reward>,
    }>,
  }>,
  missions: Array<{
    gifts: Array<Reward>,
  }>,
}

export type AtlasGrailCost = {
  [rarity: number]: {
    [kind: number]: {
      qp: number,
      addLvMax: number,
    },
  },
}

export type War = {
  id: Id<"war">,
  spots: Array<{
    quests: Array<{
      gifts: Array<Reward>,
    }>,
  }>,
}