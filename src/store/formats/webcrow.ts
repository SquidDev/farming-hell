import { runInAction } from "mobx";
import * as yup from "yup";

import { Store, newServant } from "..";
import type { Id, OwnedServant, Servant } from "../../data";
import { getAscensionTarget } from "../../data/ascension";

type SingleServant = [
  number, // Servant ID
  number, // Current Ascension
  number, // Target Ascension
  number, // Current skill 1
  number, // Target skill 1
  number, // Current skill 1
  number, // Target skill 1
  number, // Current skill 1
  number, // Target skill 1
  unknown,
  unknown,
]

type ServantsSchema = Array<SingleServant>

const servantSchema: yup.Schema<ServantsSchema> = yup.array().of(yup.tuple([
  yup.number().label("servant id").positive().integer().required() as unknown as yup.Schema<Id<"servant">>,
  yup.number().label("current ascension").min(0).max(4).integer().required(),
  yup.number().label("target ascension").min(0).max(4).integer().required(),
  yup.number().label("current skill #1").min(0).max(10).integer().required(),
  yup.number().label("target skill #1").min(0).max(10).integer().required(),
  yup.number().label("current skill #2").min(0).max(10).integer().required(),
  yup.number().label("target skill #2").min(0).max(10).integer().required(),
  yup.number().label("current skill #3").min(0).max(10).integer().required(),
  yup.number().label("target skill #3").min(0).max(10).integer().required(),

  yup.number().label("unsure #1").required(),
  yup.number().label("unsure #2").required(),
]).required()).required();

export const read = (store: Store, data: string): void => {
  let json: unknown;
  try {
    json = JSON.parse(data);
  } catch (e) {
    throw "Malformed JSON";
  }

  const lookup = new Map<number, Servant>();
  for (const object of store.servants) lookup.set(object.webcrowId, object);

  const servants = servantSchema.validateSync(json, { strict: true });
  const ownedServants: Array<OwnedServant> = [];
  for (const [id, cAsc, tAsc, cSk1, tSk1, cSk2, tSk2, cSk3, tSk3, _u1, _u2] of servants) {
    const actualServant = lookup.get(id);
    if (!actualServant) continue;

    const servant = newServant(actualServant.id);
    servant.ascension = { current: cAsc, target: tAsc };
    servant.skills[0] = { current: cSk1, target: tSk1 };
    servant.skills[1] = { current: cSk2, target: tSk2 };
    servant.skills[2] = { current: cSk3, target: tSk3 };
    ownedServants.push(servant);
  }

  runInAction(() => {
    store.ownedServants = ownedServants;
  });
};

export const write = (store: Store): string => {
  const servants: Array<SingleServant> = [];
  for (const servant of store.ownedServants) {
    const actualServant = store.servantLookup.get(servant.id);
    if (!actualServant) continue;

    const ascension = getAscensionTarget(actualServant, servant);

    servants.push([
      actualServant.webcrowId,
      ascension.current ?? 0,
      ascension.target ?? 4,
      servant.skills[0].current ?? 1,
      servant.skills[0].target ?? 10,
      servant.skills[1].current ?? 1,
      servant.skills[1].target ?? 10,
      servant.skills[2].current ?? 1,
      servant.skills[2].target ?? 10,
      1, 0,
    ]);
  }
  return JSON.stringify(servants);
};
