import { promises as fs } from "fs";
import { createHash } from "crypto";
import { VM } from "vm2";

import { TaskQueue, fileExists, getAsFile, getAsString, runCommand, runTasksInParallel } from "../support/node-extra";
import type { AtlasEvent, AtlasGrailCost, AtlasItem, AtlasServant, EventSummary, War } from "../data/atlas";
import { Id, IdMap, Skill, UpgradeItem, UpgradeRequirements, makeId } from "../data/common";
import type { DataDump, EventAppearance, GameEvent, Item, Servant } from "../data";
import type { RowData, Spreadsheets } from "../data/sheets";
import { expId, grailId, qpId } from "../data/constants";

const outDir = "_build/data";

const enableFgoSim = false;

const convertOptRangedMap = <T, U>(object: { [key: string]: T }, start: number, end: number, f: (x: T | undefined) => U): Array<U> => {
  const out: Array<U> = [];
  for (let i = start; i <= end; i++) out.push(f(object[i]));
  return out;
};

const convertRangedMap = <T, U>(object: { [key: string]: T }, start: number, end: number, f: (x: T) => U): Array<U> => {
  const out: Array<U> = [];
  for (let i = start; i <= end; i++) {
    const current = object[i];
    if (typeof current === "undefined") {
      console.error(`Undefined key ${i} in object`, object);
      process.exit(1);
    }

    out.push(f(current));
  }
  return out;
};

// Item types which are treated as "boring".
const boringTypes = new Set<string>(["svtCoin", "eventItem"]);

/**
 * Merges and converts data into a more suitable format.
 */
class Converter {
  private expGrowth: Array<number>;
  public itemMap: IdMap<Item> = new Map();
  public servants: Array<Servant> = [];

  constructor(expGrowth: Array<number>) {
    this.expGrowth = expGrowth;

    // Inject some things as extra items. These aren't actual items (exp isn't even a material) and so are special-cased
    // in the code. It's just easier to store them here.
    this.itemMap.set(expId, {
      id: expId,
      alwaysDisplay: true,
      name: "Blaze of Wisdom",
      icon: "https://static.atlasacademy.io/NA/Faces/f_97704000.png",
      background: "zero",
      priority: 11,
      events: [],
      drops: [],
    });
  }

  public addItem(item: AtlasItem, alwaysDisplay: boolean | undefined = undefined): void {
    this.itemMap.set(item.id, {
      id: item.id, name: item.name.trim(), icon: item.icon, background: item.background, priority: item.priority,
      alwaysDisplay: alwaysDisplay ?? !boringTypes.has(item.type),
      events: [],
      drops: [],
    });
  }

  private convertItemId = (item: AtlasItem): Id<"item"> => {
    if (!this.itemMap.has(item.id)) this.addItem(item);
    return item.id;
  };

  private convertUpgradeItem = ({ item, amount }: UpgradeItem<AtlasItem>): UpgradeItem<Id<"item">> =>
    ({ item: this.convertItemId(item), amount });

  private convertUpgradeRequirements = (reqs: UpgradeRequirements<AtlasItem> | undefined): UpgradeRequirements<Id<"item">> =>
    reqs ? { qp: reqs.qp, items: reqs.items.map(x => this.convertUpgradeItem(x)) } : { qp: 0, items: [] };

  private convertSkill = (skill: Skill): Skill => ({
    id: skill.id,
    name: skill.name,
    icon: skill.icon,
    detail: skill.detail,
  });

  public addServant(jpServant: AtlasServant, naServant?: AtlasServant): void {
    if (jpServant.type === "enemyCollectionDetail") return;

    const originalName = (naServant ?? jpServant).name;
    const name = originalName.replace(/\bAltria\b/, "Artoria");

    // Go through the servant changes to find possible aliases (i.e. Assassin of Inferno).
    // Also add the inferior Artoria to our aliases.
    const aliases = new Set<string>();
    for (const change of (naServant ?? jpServant).svtChange) aliases.add(change.name);
    if (originalName !== name) aliases.add(originalName);
    aliases.delete(name);

    const skills: Array<Array<Skill>> = [[], [], []];
    const seenSkills = new Set<Id<"skill">>();

    const appendSkills: Array<Array<Skill>> = [[], [], []];

    if (naServant) {
      for (const skill of naServant.skills) {
        if (seenSkills.has(skill.id)) continue;
        skills[skill.num - 1].push(this.convertSkill(skill));
        seenSkills.add(skill.id);
      }

      for (const { num, skill } of naServant.appendPassive) {
        if (seenSkills.has(skill.id)) continue;
        appendSkills[num - 100].push(this.convertSkill(skill));
        seenSkills.add(skill.id);
      }
    }

    for (const skill of jpServant.skills) {
      if (seenSkills.has(skill.id)) continue;
      skills[skill.num - 1].push(this.convertSkill(skill));
      seenSkills.add(skill.id);
    }

    for (const { num, skill } of jpServant.appendPassive) {
      if (seenSkills.has(skill.id)) continue;
      appendSkills[num - 100].push(this.convertSkill(skill));
      seenSkills.add(skill.id);
    }

    const appendSkillMaterials = convertOptRangedMap(jpServant.appendSkillMaterials, 1, 9, this.convertUpgradeRequirements);
    for (const upgrade of jpServant.appendPassive[0].unlockMaterials) {
      appendSkillMaterials.unshift({ items: [this.convertUpgradeItem(upgrade)], qp: 0 });
    }

    const details: Servant = {
      id: jpServant.id,
      webcrowId: jpServant.collectionNo,
      name,
      aliases: [...aliases],
      rarity: jpServant.rarity,
      npType: jpServant.noblePhantasms?.[0].card,
      coin: this.convertItemId(jpServant.coin.item),

      // Atlas provides materials in objects. We convert these to arrays.
      ascensions: convertRangedMap(jpServant.extraAssets.faces.ascension, 1, 4, x => x),
      skillMaterials: convertOptRangedMap(jpServant.skillMaterials, 1, 9, this.convertUpgradeRequirements),
      appendSkillMaterials,
      ascensionMaterials:
        Object.keys(jpServant.ascensionMaterials).length
          ? convertRangedMap(jpServant.ascensionMaterials, 0, 3, this.convertUpgradeRequirements)
          : undefined,
      lvlMax: convertRangedMap(jpServant.ascensionAdd.lvMax.ascension, 0, 4, x => x),

      skills,
      appendSkills,
    };
    this.servants.push(details);

    for (let i = 0; i < this.expGrowth.length; i++) {
      if (this.expGrowth[i] !== jpServant.expGrowth[i]) {
        console.warn(`Exp growth for ${name} does not match.`);
        break;
      }
    }
  }
}

/** Download an image if it doesn't already exist, and return a path to the downloaded image. */
const downloadImage = async (seen: Set<string>, url: string, skip: boolean): Promise<string> => {
  const name = `/${createHash("md5").update(url).digest("hex")}.png`;
  const path = `${outDir}${name}`;
  if (!await fileExists(path)) {
    if (skip) return url; // If skipping download, use the original URL.

    if (seen.has(name)) return name;
    seen.add(name);

    await getAsFile(url, path, false);
    await runCommand("optipng", "-strip=all", "-o7", path);
  }
  return name;
};

/** Convert a JP date to an approximate date in NA. */
const dateInNA = (jp: number): Date => {
  // Convert us to JP time. Or close enough.
  // const now = new Date();
  const date = new Date(jp * 1000);
  date.setUTCFullYear(date.getUTCFullYear() + 2);
  return date;
};

const addShopItem = (
  itemMap: IdMap<Item>,
  appearanceMap: Map<Id<"item">, EventAppearance>,
  id: Id<"item">,
  appearance: EventAppearance
): boolean => {
  if (id === qpId) return false; // Skip QP items

  // Try to merge existing items where possible.
  const existing = appearanceMap.get(id);
  if (existing) {
    if (existing.event !== appearance.event || existing.kind !== appearance.kind) throw new Error("Mismatched event appearance");
    existing.amount += appearance.amount;
    return true;
  }

  const item = itemMap.get(id);
  if (!item) return false;

  item.events.push(appearance);
  appearanceMap.set(id, appearance);
  return true;
};

/** Map Drop spreadsheet names to Atlas ones. */
const dropNames: { [key: string]: string } = {
  "Small Bells of Amnesty": "Small Bell of Amnesty",
  "Octuplet Crystal": "Octuplet Crystals",
  "Moonlit Tiara": "Shining Silver Crown",
  "Shell of Reminiscense": "Shell of Reminiscence",
  "Demon Flame Lantern": "Oni Flame Lantern",
  "Divine Spirit Particle": "Divine Leyline Spiritron",
};

const addDropData = (
  itemMap: Map<string, Item>,
  rows: Array<RowData>,
  startingColumn: number,
): void => {
  let currentItem: Item | undefined = undefined;
  for (const row of rows) {
    const itemName = row.values[startingColumn].formattedValue;
    if (itemName) {
      currentItem = itemMap.get(itemName) ?? itemMap.get(dropNames[itemName]);
      if (!currentItem) {
        console.warn(`Unknown item ${itemName}`);
      }
    }
    if (!currentItem) continue;

    const area = row.values[startingColumn + 3].formattedValue;
    const quest = row.values[startingColumn + 4].formattedValue;
    const link = row.values[startingColumn + 4].hyperlink;
    const ap = row.values[startingColumn + 6].effectiveValue?.numberValue;
    const ap_drop = row.values[startingColumn + 7].effectiveValue?.numberValue;
    const drop = row.values[startingColumn + 9].effectiveValue?.numberValue;

    if (!area || !quest || !link || typeof ap !== "number" || typeof ap_drop !== "number" || typeof drop !== "number") {
      // Don't warn if we're just an empty row.
      if (area && quest && area !== "Area" && quest !== "Quest") {
        console.warn(`Invalid drops for ${currentItem.name}, skipping.`, { area, quest, link, ap, ap_drop, drop });
      }
      continue;
    }

    currentItem.drops.push({ area, quest, link, ap, ap_drop, drop });
  }
};

/** Load in the servant DB from FGO Material Simulator and write the resulting IDs. */
const extractFgoSim = async (): Promise<void> => {
  const vm = new VM({ eval: false, wasm: false, allowAsync: false, timeout: 500 });
  vm.run("$ = () => {};");
  vm.runFile(`${outDir}/fgo_sim.js`);
  const servants = vm.getGlobal("Servantdb") as Array<{ id: number, text2: string }>;
  const processedServants = servants.map(x => ({ id: x.id, name: x.text2.replace(/\s+/g, " ") }));

  await fs.writeFile(`${outDir}/fgo_sim.json`, JSON.stringify(processedServants));
};

/**
 * Compute FGO Material Simulator ids. These appear to be manually assigned, and so are often inconsistent with FGO's
 * internal ids, so we need to do some remapping.
 *
 * @param servants List of all servants.
 */
const recomputeFgoSimIds = (servants: Array<Servant>): void => {
  const mapping = new Map<Id<"servant">, number>();

  mapping.set(makeId("servant", 101700), 150); // Musashi
  mapping.set(makeId("servant", 602500), 151); // First Hassan
  mapping.set(makeId("servant", 303200), 152); // Ereshkigal

  mapping.set(makeId("servant", 402600), 176); // Ishtar (Rider)
  mapping.set(makeId("servant", 402700), 177); // Artoria Pendragon Alter (Rider)
  mapping.set(makeId("servant", 202800), 178); // Helena Blavatsky (Archer)
  mapping.set(makeId("servant", 302900), 179); // Minamoto-no-Raikou (Lancer)

  mapping.set(makeId("servant", 2500100), 191); // Abigail Williams

  mapping.set(makeId("servant", 403100), 225); // Red Hare
  mapping.set(makeId("servant", 900600), 227); // Qin Shi Huang

  mapping.set(makeId("servant", 104800), 295); // Karna (Santa)
  mapping.set(makeId("servant", 304600), 296); // Vritra

  for (const servant of servants) {
    const overwrite = mapping.get(servant.id);
    if (overwrite !== undefined) {
      servant.webcrowId = overwrite;
      continue;
    }

    // Best if you don't ask.
    if (servant.webcrowId >= 149) servant.webcrowId--;
    if (servant.webcrowId >= 153) servant.webcrowId--;
    if (servant.webcrowId >= 167) servant.webcrowId--;
    if (servant.webcrowId >= 188) servant.webcrowId--;
    if (servant.webcrowId >= 192) servant.webcrowId--;
    if (servant.webcrowId >= 211) servant.webcrowId++;
    if (servant.webcrowId >= 237) servant.webcrowId--;
    if (servant.webcrowId >= 329) servant.webcrowId--;
  }
};

void (async () => {
  let skipVersionCheck = false, skipImageDownload = false;
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === "--skip-version-check") {
      skipVersionCheck = true;
    } else if (arg === "--skip-image-download") {
      skipImageDownload = true;
    } else {
      console.error(`Unknown argument ${arg}`);
      process.exit(1);
    }
  }


  await fs.mkdir(outDir, { recursive: true });

  const versionFile = `${outDir}/version.json`;
  let version: string | null;
  try {
    version = await fs.readFile(versionFile, "utf-8");
  } catch {
    version = null;
  }

  const newVersion = skipVersionCheck ? (version ?? "Unknown") : await getAsString("https://api.atlasacademy.io/info");
  const isNew = version !== newVersion;

  // Fetch data if available
  await getAsFile("https://api.atlasacademy.io/export/JP/nice_servant_lang_en.json", `${outDir}/servants_jp.json`, isNew);
  await getAsFile("https://api.atlasacademy.io/export/NA/nice_servant.json", `${outDir}/servants_na.json`, isNew);
  await getAsFile("https://api.atlasacademy.io/export/JP/basic_event_lang_en.json", `${outDir}/events_jp.json`, isNew);
  await getAsFile("https://api.atlasacademy.io/export/NA/nice_item.json", `${outDir}/items_na.json`, isNew);
  await getAsFile("https://api.atlasacademy.io/export/JP/NiceSvtGrailCost.json", `${outDir}/grail_jp.json`, isNew);
  if (enableFgoSim) await getAsFile("http://fgosimulator.webcrow.jp/Material/js/fgos_material.min.js", `${outDir}/fgo_sim.js`, isNew);

  const sheetsKey = process.env.SHEETS_KEY;
  if (sheetsKey) {
    // Somewhat incorrect to tie this to the data version, but good enough (TM).
    await getAsFile(
      `https://sheets.googleapis.com/v4/spreadsheets/1_SlTjrVRTgHgfS7sRqx4CeJMqlz687HdSlYqiW-JvQA?ranges=Best%205%20AP%2FDrop%20%28NA%29&key=${sheetsKey}&fields=sheets`,
      `${outDir}/drops.json`, isNew
    );
    // We could fetch https://docs.google.com/spreadsheets/d/1_SlTjrVRTgHgfS7sRqx4CeJMqlz687HdSlYqiW-JvQA/gviz/tq?tqx=out:csv&sheet=Best%205%20AP%2FDrop%20%28NA%29 instead,
    // but it doesn't have formatting and so we cannot extract links.
  } else {
    console.warn("SHEETS_KEY environment variable not present, skipping drop download");
  }
  await fs.writeFile(versionFile, newVersion);

  // Merge the two data sources
  const naServants = JSON.parse(await fs.readFile(`${outDir}/servants_na.json`, "utf-8")) as Array<AtlasServant>;
  const jpServants = JSON.parse(await fs.readFile(`${outDir}/servants_jp.json`, "utf-8")) as Array<AtlasServant>;
  const events = JSON.parse(await fs.readFile(`${outDir}/events_jp.json`, "utf-8")) as Array<EventSummary>;
  const items = JSON.parse(await fs.readFile(`${outDir}/items_na.json`, "utf-8")) as Array<AtlasItem>;
  const grailCost = JSON.parse(await fs.readFile(`${outDir}/grail_jp.json`, "utf-8")) as AtlasGrailCost;
  const expGrowth = jpServants[0].expGrowth;

  const converter = new Converter(expGrowth);
  converter.addItem(items.find(x => x.id === qpId)!, true);
  converter.addItem(items.find(x => x.id === grailId)!, true);

  const mergedServants = new Map<Id<"servant">, { jp: AtlasServant, na?: AtlasServant }>();
  for (const servant of jpServants) mergedServants.set(servant.id, { jp: servant });
  for (const servant of naServants) mergedServants.get(servant.id)!.na = servant;
  for (const servant of mergedServants.values()) converter.addServant(servant.jp, servant.na);
  const { servants, itemMap } = converter;

  // Find all events which occur after now and sort them by how soon they are. Also skip 80038 (i.e. Solomon).
  // TODO: We probably should do this filter in the app too.
  const now = Date.now();
  const recentEvents = events
    .filter(x => dateInNA(x.finishedAt).getTime() >= now && x.id !== makeId("event", 80038))
    .sort((a, b) => a.startedAt - b.startedAt);

  const tasks: TaskQueue = [];

  // Download all images for servants and items.
  const seenImages = new Set<string>();
  for (const servant of servants) {
    tasks.push(async () => {
      for (let i = 0; i < servant.ascensions.length; i++) {
        servant.ascensions[i] = await downloadImage(seenImages, servant.ascensions[i], skipImageDownload);
      }
      for (const skills of servant.skills) {
        for (const skill of skills) skill.icon = await downloadImage(seenImages, skill.icon, skipImageDownload);
      }
      for (const skills of servant.appendSkills) {
        for (const skill of skills) skill.icon = await downloadImage(seenImages, skill.icon, skipImageDownload);
      }
    });
  }
  for (const item of itemMap.values()) {
    tasks.push(async () => { item.icon = await downloadImage(seenImages, item.icon, skipImageDownload); });
  }

  recomputeFgoSimIds(servants);

  // Download all additional data about events.
  const wars = new Set<Id<"war">>();
  for (const event of events) {
    tasks.push(async () => {
      await getAsFile(`https://api.atlasacademy.io/nice/JP/event/${event.id}?lang=en`, `${outDir}/event_${event.id}.json`);
      const eventData = JSON.parse(await fs.readFile(`${outDir}/event_${event.id}.json`, "utf-8")) as AtlasEvent;
      for (const war of eventData.warIds) {
        if (!wars.has(war)) {
          wars.add(war);
          tasks.push(() => getAsFile(`https://api.atlasacademy.io/nice/JP/war/${war}?lang=en`, `${outDir}/war_${war}.json`));
        }
      }
    });
  }

  await runTasksInParallel(tasks);

  // Loop through all events and find rewards.
  const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
  const usefulEvents: Array<GameEvent> = [];
  for (const event of recentEvents) {
    const eventData = JSON.parse(await fs.readFile(`${outDir}/event_${event.id}.json`, "utf-8")) as AtlasEvent;
    let useful = false;

    // Strip flavour text after `~' and remove new lines.
    const name = event.name.replace(/ *[～~].*$/, "").replace(/\s+/g, " ");

    const items = new Map<Id<"item">, EventAppearance>();
    for (const item of eventData.shop) {
      if (item.targetIds.length !== 1) {
        console.warn(`Event '${name}' has shop item whose length !== 1.`);
        continue;
      }

      useful = addShopItem(itemMap, items, item.targetIds[0], { event: event.id, kind: "shop", amount: item.limitNum }) || useful;
    }

    items.clear();
    for (const lottery of eventData.lotteries) {
      for (const box of lottery.boxes) {
        if (box.boxIndex !== 10) continue;
        if (box.gifts.length !== 1) {
          console.warn(`Event '${name}' has lottery whose length !== 1.`);
          continue;
        }

        useful = addShopItem(itemMap, items, box.gifts[0].objectId, { event: event.id, kind: "lottery", amount: box.maxNum }) || useful;
      }
    }

    items.clear();
    for (const mission of eventData.missions) {
      for (const reward of mission.gifts) {
        useful = addShopItem(itemMap, items, reward.objectId, { event: event.id, kind: "mission", amount: reward.num }) || useful;
      }
    }

    items.clear();
    for (const warId of eventData.warIds) {
      const war = JSON.parse(await fs.readFile(`${outDir}/war_${warId}.json`, "utf-8")) as War;
      for (const spots of war.spots) {
        for (const quest of spots.quests) {
          for (const gift of quest.gifts) {
            useful = addShopItem(itemMap, items, gift.objectId, { event: event.id, kind: "quest", amount: gift.num }) || useful;
          }
        }
      }
    }

    if (useful) {
      usefulEvents.push({
        id: event.id,
        name,
        date: dateFormat.format(dateInNA(event.startedAt)),
      });
    }
  }

  // Loop through and find drop data
  const itemNames = new Map<string, Item>();
  for (const item of itemMap.values()) itemNames.set(item.name, item);
  if (await fileExists(`${outDir}/drops.json`)) {
    const spreadsheet = JSON.parse(await fs.readFile(`${outDir}/drops.json`, "utf-8")) as Spreadsheets;
    addDropData(itemNames, spreadsheet.sheets[0].data[0].rowData, 2);
    addDropData(itemNames, spreadsheet.sheets[0].data[0].rowData, 18);
  }

  // Extract additional data for tests
  if (enableFgoSim) await extractFgoSim();

  const result: DataDump = {
    servants: servants.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    }),
    items: [...itemMap.values()].sort((a, b) => a.priority - b.priority),
    events: usefulEvents,
    expGrowth,
    grailCosts: convertRangedMap(grailCost, 0, 5, r => convertRangedMap(r, 1, Object.keys(r).length, g => ({ add: g.addLvMax, qp: g.qp }))),
  };

  await fs.writeFile(`${outDir}/dump.json`, JSON.stringify(result));
})();
