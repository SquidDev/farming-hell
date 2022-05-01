import { promises as fs } from "fs";

import { fsStore } from "../test";
import { fileExists } from "../support/node-extra";

const makeLookup = <K, V>(objs: Array<V>, keyFn: (o: V) => K): Map<K, V> => {
  const out = new Map<K, V>();
  for (const obj of objs) out.set(keyFn(obj), obj);
  return out;
};

const normaliseServant = (x : string): string => x.toLowerCase().replace(/-/g, " ");

test("Has a basic list of items", async () => {
  const store = await fsStore();
  expect(store.items.filter(x => x.alwaysDisplay).map(x => `${x.id} => ${x.name}`)).toMatchSnapshot();
});

test("Includes webcrow IDs", async () => {
  const store = await fsStore();

  const servants = [...store.servants].sort((a, b) => a.webcrowId - b.webcrowId);

  const fgoContents = await fileExists("_build/data/fgo_sim.json")
    ? await fs.readFile("_build/data/fgo_sim.json", "utf-8")
    : await fs.readFile("data/fgo_sim.json", "utf-8");
  const fgoSimServants = JSON.parse(fgoContents) as Array<{ id: number, name: string }>;
  const fgoSimById = makeLookup(fgoSimServants, x => x.id);

  const different: Array<string> = [];
  for (const servant of servants) {
    const simServant = fgoSimById.get(servant.webcrowId)?.name ?? "";

    if (normaliseServant(simServant) === normaliseServant(servant.name)) continue;
    different.push(`${servant.webcrowId} => ours=${servant.id}:'${servant.name}' theirs='${simServant}'`);
  }

  expect(different).toMatchSnapshot();
});
