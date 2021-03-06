import type { Id, OwnedServant, Servant, Target, UpgradeRequirements } from ".";
import type { Store } from "../store";
import { getAscensionTargetFast } from "./ascension";
import { expEffective, expNormal, grailId } from "./constants";

export type Requirements = {
  qp: number,
  exp: number,
  expBonus: number,
  items: Map<Id<"item">, number>,
}

const addRequirements = (
  requirements: Requirements,
  { current, target }: Target, offset: number,
  materials: Array<UpgradeRequirements>,
): void => {
  if (target === undefined) return;
  if (current === undefined) current = offset;

  for (let i = current; i < target; i++) {
    const thisLevel = materials[i - offset];
    for (const item of thisLevel.items) {
      requirements.items.set(item.item, (requirements.items.get(item.item) ?? 0) + item.amount);
    }

    requirements.qp += thisLevel.qp;
  }
};

const addExpRequirements = (requirements: Requirements, store: Store, servant: OwnedServant, details: Servant): void => {
  let current = servant.level.current;
  const target = servant.level.target;
  if (current === undefined) current = 1;
  if (target === undefined || current >= target) return;

  const currentExp = store.expGrowth[current - 1];
  const targetExp = store.expGrowth[target - 1];
  if (currentExp === undefined || targetExp === undefined) return;

  const cost = targetExp - currentExp;
  requirements.exp += Math.ceil(cost / expNormal);
  requirements.expBonus += Math.ceil(cost / expEffective);

  const maxLevel = details.lvlMax[4];
  if (target > maxLevel) {
    const grailCosts = store.grailCosts[details.rarity];
    let i = 0;

    if (current > maxLevel) {
      // First find the point where we're up to. Consider us at lvl 93, we want to
      // finish with i = 2 (where grailCosts + 6).
      for (; i < grailCosts.length; i++) {
        if (maxLevel + grailCosts[i].add >= current) break;
      }
      i++;
    }

    let grails = 0, coins = 0;
    for (; i < grailCosts.length; i++) {
      const grail = grailCosts[i];
      const withGrail = maxLevel + grail.add;
      requirements.qp += grail.qp;
      grails++;
      if (withGrail > 100) coins += 30;
      if (withGrail >= target) break;
    }

    if (grails > 0) requirements.items.set(grailId, (requirements.items.get(grailId) ?? 0) + grails);
    if (coins > 0) requirements.items.set(details.coin, (requirements.items.get(details.coin) ?? 0) + coins);
  }
};

export const addSplitServantRequirements = (
  ascensionReqs: Requirements, skillReqs: Requirements,
  store: Store, servant: OwnedServant, details: Servant
): void => {
  for (const skill of servant.skills) addRequirements(skillReqs, skill, 1, details.skillMaterials);
  for (const skill of servant.appendSkills) addRequirements(skillReqs, skill, 0, details.appendSkillMaterials);
  if (details.ascensionMaterials) {
    addRequirements(ascensionReqs, getAscensionTargetFast(details, servant), 0, details.ascensionMaterials);
  }

  addExpRequirements(ascensionReqs, store, servant, details);
};

export const addServantRequirements = (requirements: Requirements, store: Store, servant: OwnedServant, details: Servant): void =>
  addSplitServantRequirements(requirements, requirements, store, servant, details);

export const newRequirements = (): Requirements => ({ qp: 0, exp: 0, expBonus: 0, items: new Map() });
