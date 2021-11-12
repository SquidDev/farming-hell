import type { OwnedServant, Servant, Target } from ".";

export const getActualAscension = ({ lvlMax }: Servant, level: number): number => {
  for (let i = 0; i < lvlMax.length; i++) {
    if (level <= lvlMax[i]) return i;
  }

  return 4;
};

export const getAscensionTarget = (servant: Servant, { ascension, level }: OwnedServant): Target => {
  const current = ascension.current ?? (level.current !== undefined ? getActualAscension(servant, level.current) : undefined);
  const target = ascension.target ?? (level.target !== undefined ? getActualAscension(servant, level.target) : undefined);
  return { current, target };
};

/**
 * Optimised version of getAscensionTargetNoCopy which avoids copying the ascensions where possible.
 *
 * This is preferred when working inside a MobX observable context, but should be avoided otherwise.
 */
export const getAscensionTargetFast = (servant: Servant, details: OwnedServant): Target => {
  const { level, ascension } = details;
  if (ascension.current !== undefined && ascension.target !== undefined) return ascension;
  if (level.current === undefined && level.target === undefined) return ascension;
  return getAscensionTarget(servant, details);
};
