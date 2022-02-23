import type { Target } from "../../data";
import type { Store } from "..";

export const write = (store: Store): string => {
  const target = ({ current, target }: Target): string => `${typeof current === "number" ? current : ""},${typeof target === "number" ? target : ""}`;

  return store.ownedServants.map(servant => {
    const details = store.servantLookup.get(servant.id)!;
    return (
      `${servant.id},${details.name},${target(servant.level)},${target(servant.ascension)},` +
      `${target(servant.skills[0])},${target(servant.skills[1])},${target(servant.skills[2])}`
    );
  }).join("\n");
};
