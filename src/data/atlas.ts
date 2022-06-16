/**
 * Type definitions exclusive to the atlas academy data dump.
 *
 * These are only used by bin/extract-data to convert into a more compact
 * format.
 */

import type { CardColour, Id, Item as Item_, Skill, UpgradeItem, UpgradeRequirements } from "./common";


export type AtlasItem = Item_ & {
  individuality: Array<{ id: number, name: number }>,
  type: string,
}

/** A noble phantasm usable by a servant. */
export type NoblePhantasm = {
  id: Id<"noblePhantasm">,
  num: number,
  card: CardColour,
};

export type AppendSkill = {
  num: number,
  skill: Skill,
  unlockMaterials: Array<UpgradeItem<AtlasItem>>,
}

/**
 * A servant within the nice_servant.json file. We don't actually use this
 * directly, we convert it to a UsefulServant which holds information in a more
 * accessible way.
 */
export type AtlasServant = {
  id: Id<"servant">,
  collectionNo: number,
  name: string,
  type: string,
  rarity: number,
  extraAssets: {
    faces: {
      /** A mapping containing keys "1".."4" where each  */
      ascension: { [key: string]: string },
    },
  },
  coin: { item: AtlasItem },

  /** Materials required to ascend. Contains "0".."3". */
  ascensionMaterials: { [key: string]: UpgradeRequirements<AtlasItem> },

  /** Materials required to upgrade skills. Contains "1".."9". */
  skillMaterials: { [key: string]: UpgradeRequirements<AtlasItem> },
  appendSkillMaterials: { [key: string]: UpgradeRequirements<AtlasItem> },
  skills: Array<Skill & { num: number }>,
  appendPassive: Array<AppendSkill>,
  expGrowth: Array<number>,
  noblePhantasms: Array<NoblePhantasm>,

  ascensionAdd: {
    lvMax: {
      ascension: { [key: number]: number },
    },
  },

  svtChange: Array<{
    name: string
  }>,
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
