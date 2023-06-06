/**
 * Read/write data from our internal representation.
 *
 * This is used for storing to local storage and as a transfer/backup format
 * between different sites. It's not designed to be read/written by other tools,
 * and so we do no validation.
 */

import { runInAction, toJS } from "mobx";

import type { Store } from "..";
import { type Filters, type Id, type OwnedServant, makeId } from "../../data";
import { qpId } from "../../data/constants";
import { defaultFilters } from "../filter";

type PartialOwnedServant = Omit<OwnedServant, "appendSkills"> & Partial<Pick<OwnedServant, "appendSkills">>;

type LatestSchema = {
  version: 1,
  servants: Array<PartialOwnedServant>,
  items?: Array<[Id<"item">, number]>,
  filters?: Filters,
};

type Schemas
  = Array<PartialOwnedServant>
  | LatestSchema;

const readImpl = (store: Store, data: Schemas): void => {
  let servants: Array<PartialOwnedServant> = [];
  const items: Map<Id<"item">, number> = new Map();
  let filters: Filters = defaultFilters;

  if (data instanceof Array) {
    servants = data;
  } else if (data.version === 1) {
    servants = data.servants;
    if (data.items) {
      for (const [id, count] of data.items) items.set(id, count);
    }
    if (data.filters) filters = data.filters;
  } else {
    throw new Error("Failed to parse this data.");
  }

  const fixedServants = servants.map(servant => {
    servant.appendSkills ??= [{}, {}, {}];
    return servant as OwnedServant;
  });

  // Convert our legacy QP item (id=5) to the current one (id=1).
  const oldQpId = makeId("item", 5);
  const qp = items.get(oldQpId);
  if (qp !== undefined) {
    items.set(qpId, qp);
    items.delete(oldQpId);
  }

  runInAction(() => {
    store.ownedServants = fixedServants;
    store.ownedItems = items;
    store.filters = filters;
  });
};

export const read = (store: Store, contents: string): void => {
  readImpl(store, JSON.parse(contents) as Schemas);
};

export const write = (store: Store, withFilters = false): string => {
  const data: LatestSchema = {
    version: 1,
    servants: toJS(store.ownedServants),
    items: [...store.ownedItems.entries()],
    filters: withFilters ? store.filters : undefined,
  };
  return JSON.stringify(data);
};
