import { autorun, configure, makeAutoObservable } from "mobx";
import { v4 as uuidV4 } from "uuid";

import { DataDump, Filters, GameEvent, GrailCosts, Id, IdMap, Item, OwnedServant, Priority, Servant, makeId } from "../data";
import { Requirements, addServantRequirements, newRequirements } from "../data/requirements";
import { loadFromLocalStorage, saveToLocalStorage } from "./save";
import { defaultFilters } from "./filter";
import { expId, qpId } from "../data/constants";


if (process.env.NODE_ENV === "development") {
  configure({
    enforceActions: "always",
    computedRequiresReaction: true,
    reactionRequiresObservable: true,
    observableRequiresReaction: true,
    disableErrorBoundaries: true
  });
}

const makeLookup = <T extends { id: Id<string> }>(objects: Array<T>): IdMap<T> => {
  const lookup: IdMap<T> = new Map();
  for (const object of objects) lookup.set(object.id, object);
  return lookup;
};


/**
 * The global data store of servants.
 *
 * This is powered by mobx because I can't be dealing with Redux. Imperative
 * mutations to the store a propagated globally throughout the app.
 *
 * The store holds two bits of information:
 *  - All servants currently in NA. This is not tracked by mobx (and is
 *    notionally immutable).
 *  - The list of currently owned servants.
 */
export class Store {
  public readonly servants: Array<Servant>;
  public readonly items: Array<Item>;
  public readonly servantLookup: IdMap<Servant>;
  public readonly itemLookup: IdMap<Item>;
  public readonly eventLookup: IdMap<GameEvent>;
  public readonly expGrowth: Array<number>;
  public readonly grailCosts: GrailCosts;

  public ownedServants: Array<OwnedServant> = [];
  public ownedItems: Map<Id<"item">, number> = new Map();
  public filters: Filters = defaultFilters;

  constructor({ servants, items, events, expGrowth, grailCosts }: DataDump) {
    this.servants = servants;
    this.items = items;
    this.servantLookup = makeLookup(servants);
    this.itemLookup = makeLookup(items);
    this.eventLookup = makeLookup(events);
    this.expGrowth = expGrowth;
    this.grailCosts = grailCosts;

    makeAutoObservable(this, {
      servants: false,
      items: false,
      itemLookup: false,
      servantLookup: false,
      eventLookup: false,
      expGrowth: false,
      grailCosts: false,
    });
  }

  /**
   * Get requirements for all or a subset of servants.
   * @param filter Check whether this servant's requirements should be included.
   * @returns The accumulated requirements.
   */
  public getRequirements(filter?: (servant: OwnedServant, details: Servant) => boolean): Requirements {
    const requirements = newRequirements();
    for (const servant of this.ownedServants) {
      const details = this.servantLookup.get(servant.id);
      if (!details || (filter && !filter(servant, details))) continue;
      addServantRequirements(requirements, this, servant, details);
    }

    return requirements;
  }

  /** Get all required items. */
  public get requirements(): Requirements {
    return this.getRequirements();
  }

  public get requirementItems(): Array<{ item: Item, getter: (r: Requirements) => number }> {
    const result: Array<{ item: Item, getter: (r: Requirements) => number }> = [
      { item: this.itemLookup.get(qpId)!, getter: r => r.qp },
      { item: this.itemLookup.get(expId)!, getter: r => r.expBonus },
    ];

    for (const item of this.items) {
      if (item.id === qpId || item.id === expId) continue; // These have custom getters so skip.
      result.push({ item, getter: r => r.items.get(item.id) ?? 0 });
    }

    return result;
  }
}

export const artoriaPendragon: Id<"servant"> = makeId("servant", 100100);

/** Construct a new owned servant. */
export const newServant = (id?: Id<"servant">): OwnedServant => ({
  uid: uuidV4(),
  id: id ?? artoriaPendragon,
  priority: Priority.Low,
  level: {},
  ascension: {},
  skills: [{}, {}, {}],
});

/**
 * Construct a store driven from local storage. This is automatically saved
 * when the servants change.
 */
export const localStore = (data: DataDump): Store => {
  const store = new Store(data);

  try {
    loadFromLocalStorage(store);
  } catch (e) {
    console.error("Cannot load from local storage", e);
  }

  autorun(() => {
    try {
      saveToLocalStorage(store);
    } catch (e) {
      console.error("Cannot save to local storage", e);
    }
  });

  return store;
};
