import { promises as fs } from "fs";
import { createHash } from "crypto";

import { Store } from "../store";
import type { DataDump } from "../data";

const updateImage = (name: string): string =>
  name.startsWith("/") ? name : `/${createHash("md5").update(name).digest("hex")}.png`;

export const fsStore = async (): Promise<Store> => {
  const data = JSON.parse(await fs.readFile("_build/data/dump.json", "utf-8")) as DataDump;

  // Patch all image links so they're "local".
  for (const servant of data.servants) {
    for (let i = 0; i < servant.ascensions.length; i++) servant.ascensions[i] = updateImage(servant.ascensions[i]);
    for (const skills of servant.skills) {
      for (const skill of skills) skill.icon = updateImage(skill.icon);
    }
  }
  for (const item of data.items) item.icon = updateImage(item.icon);

  return new Store(data);
};
