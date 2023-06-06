import type { FunctionComponent } from "react";

import type { Store } from "../store";
import type { Id } from "../data";
import { classNames, Icon } from "../support/utils";
import { expId, qpId } from "../data/constants";


/** Displays an item and how much of it it is required in small text on-top. */
export const ItemWithAmount: FunctionComponent<{ item: Id<"item">, store: Store, amount: number | string, difference?: boolean }> = ({ item, store, amount, difference }) => {
  const itemDetails = store.itemLookup.get(item)!;
  return <div className="w-12 h-12 inline-block relative" title={itemDetails.name}>
    <Icon src={itemDetails.icon} alt={itemDetails.name} title={itemDetails.name} className="w-12 h-12" />
    <span className={classNames(
      "absolute bottom-0 right-0 text-ring",
      difference ? (amount < 0 ? "text-red-400" : "text-green-400") : "text-white"
    )}>{amount}</span>
  </div>;
};


export const formatValue = (qp: number): string => {
  if (qp >= 1e9) {
    return `${Math.round(1000 * (qp / 1e9)) / 1000}B`;
  } else if (qp >= 1e6) {
    return `${Math.round(1000 * (qp / 1e6)) / 1000}M`;
  } else if (qp >= 1e4) {
    return `${qp / 1000}K`;
  } else {
    return `${qp}`;
  }
};

/**
 * Like `ItemWithAmount` but for QP. This has a rather different design due to the sheer amount of QP you need.
 */
export const QPWithAmount: FunctionComponent<{ store: Store, amount: number, className: string }> = ({ store, amount, className }) => {
  if (amount === 0) return null;
  const itemDetails = store.itemLookup.get(qpId)!;

  return <div className={`flex flex-column items-center flex-nowrap ${className}`} title={itemDetails.name}>
    <Icon className="w-12 h-12 inline-bock mr-1" alt={itemDetails.name} src={itemDetails.icon} />
    <span className="font-bold text-xl">× {formatValue(amount)}</span>
  </div>;
};


/**
 * Like `ItemWithAmount` but for embers. We want to display both normal and bonus Exp usage.
 */
export const EmberWithAmount: FunctionComponent<{ store: Store, amount: number, bonusAmount: number, className: string }> = ({ store, amount, bonusAmount, className }) => {
  if (amount === 0) return null;
  const itemDetails = store.itemLookup.get(expId)!;

  return <div className={`flex flex-column items-center flex-nowrap ${className}`} title={itemDetails.name}>
    <Icon className="w-12 h-12 inline-bock squircle mr-1" alt={itemDetails.name} src={itemDetails.icon} />
    <span className="text-xl" title={`Requires ${amount} Blaze of Wisdom, or ${bonusAmount} if using the optimal type.`}>
      <strong>× {formatValue(bonusAmount)}</strong> ({formatValue(amount)})
    </span>
  </div>;
};
