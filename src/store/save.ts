import { runInAction, toJS } from "mobx";

import save from "../support/save";
import type { Store } from ".";
import { Filters, Id, OwnedServant, Target, makeId } from "../data";
import { defaultFilters } from "./filter";
import { qpId } from "../data/constants";

type LatestSchema = {
  version: 1,
  servants: Array<OwnedServant>,
  items?: Array<[Id<"item">, number]>,
  filters?: Filters,
};

type Schemas
  = Array<OwnedServant>
  | LatestSchema;

const load = (store: Store, data: Schemas): void => {
  let servants: Array<OwnedServant> = [];
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

  // Convert our legacy QP item (id=5) to the current one (id=1).
  const oldQpId = makeId("item", 5);
  const qp = items.get(oldQpId);
  if (qp !== undefined) {
    items.set(qpId, qp);
    items.delete(oldQpId);
  }

  runInAction(() => {
    store.ownedServants = servants;
    store.ownedItems = items;
    store.filters = filters;
  });
};

export const loadFromLocalStorage = (store: Store): void => {
  const servantData = window.localStorage.getItem("servants");
  if (!servantData) return;

  load(store, JSON.parse(servantData) as Schemas);
};

export const saveToLocalStorage = (store: Store): void => {
  const data: LatestSchema = {
    version: 1,
    servants: toJS(store.ownedServants),
    items: [...store.ownedItems.entries()],
    filters: store.filters,
  };
  window.localStorage.setItem("servants", JSON.stringify(data));
};

export const loadFromJson = (store: Store, blob: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        load(store, JSON.parse(reader.result as string) as Schemas);
      } catch (e) {
        reject(`Failed to read file (${e})`); // eslint-disable-line @typescript-eslint/restrict-template-expressions
        return;
      }

      resolve();
    });
    reader.addEventListener("error", () => reject("Failed to read file"));
    reader.readAsText(blob);
  });
};

export const pickAndLoadFromJson = (store: Store): void => {
  const fileInput: HTMLInputElement = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json";
  fileInput.addEventListener("input", () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    loadFromJson(store, file).catch(e => console.error(e));
  });
  fileInput.click();
};

export const saveToJson = (store: Store): void => {
  const data: LatestSchema = {
    version: 1,
    servants: toJS(store.ownedServants),
    items: [...store.ownedItems.entries()],
  };
  save("fgo-planner.json", new Blob([JSON.stringify(data)], { type: "application/json" }));
};

export const saveToCsv = (store: Store): void => {
  const target = ({ current, target }: Target): string => `${typeof current === "number" ? current : ""},${typeof target === "number" ? target : ""}`;

  const contents = store.ownedServants.map(servant => {
    const details = store.servantLookup.get(servant.id)!;
    return (
      `${servant.id},${details.name},${target(servant.level)},${target(servant.ascension)},` +
      `${target(servant.skills[0])},${target(servant.skills[1])},${target(servant.skills[2])}`
    );
  }).join("\n");
  save("fgo-planner.csv", new Blob([contents], { type: "text/csv" }));
};
