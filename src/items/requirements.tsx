import { useContext, createContext, type FunctionComponent, type ReactElement } from "react";
import { observer } from "mobx-react-lite";

import { byPriority } from "../data/order";
import { type Requirements, addServantRequirements, newRequirements } from "../data/requirements";
import type { Store } from "../store";
import type { OwnedServant } from "../data";
import { EmberWithAmount, ItemWithAmount, QPWithAmount } from "./item";

export const ShowDifference = createContext(false);

/** A display for a set of requirements, including QP and items. */
export const ShortRequirements: FunctionComponent<{ requirements: Requirements, store: Store }> = observer(function ShortRequirements({ requirements: { items, qp, exp, expBonus }, store }) {
  const showDifference = useContext(ShowDifference);
  const ownedItems = store.ownedItems;

  const itemList: Array<ReactElement<unknown>> = [...items.keys()].sort(byPriority(store.itemLookup)).map(key => {
    let amount = items.get(key)!;
    if (showDifference) amount = (ownedItems.get(key) || 0) - amount;
    return <ItemWithAmount key={key} item={key} store={store} amount={amount} difference={showDifference} />;
  });
  return <>
    {qp > 0 || exp > 0 ? <div className="flex flex-row justify-between">
      <QPWithAmount className="mb-2" store={store} amount={qp} />
      <EmberWithAmount className="mb-2" store={store} amount={exp} bonusAmount={expBonus} />
    </div> : null}
    {itemList}
  </>;
});

/** Convenience wrapper over `ShortRequirements` for a servant's requirements.  */
export const ShortServantRequirements: FunctionComponent<{ servant: OwnedServant, store: Store }> = observer(function ShortServantRequirements({ servant, store }) {
  const details = store.servantLookup.get(servant.id);
  const requirements = newRequirements();
  if (details) addServantRequirements(requirements, store, servant, details);

  return <ShortRequirements requirements={requirements} store={store} />;
});
