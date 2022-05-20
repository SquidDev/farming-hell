import { newServant } from "../store";
import { fsStore } from "../test";
import { grailId } from "./constants";
import { addServantRequirements, newRequirements } from "./requirements";

test("Computes ascension materials", async () => {
  const store = await fsStore();

  const servant = newServant();
  servant.ascension = { current: 0, target: 4 };

  const requirements = newRequirements();
  addServantRequirements(requirements, store, servant, store.servantLookup.get(servant.id)!);
  expect(requirements).toMatchSnapshot();
});

test("Ascension defaults to level 0", async () => {
  const store = await fsStore();

  const servant = newServant();
  servant.ascension.target = 4;

  const requirements = newRequirements();
  addServantRequirements(requirements, store, servant, store.servantLookup.get(servant.id)!);
  expect(requirements).toMatchSnapshot();
});

test("Computes skill materials", async () => {
  const store = await fsStore();

  const servant = newServant();
  servant.skills[0] = { current: 1, target: 10 };

  const requirements = newRequirements();
  addServantRequirements(requirements, store, servant, store.servantLookup.get(servant.id)!);
  expect(requirements).toMatchSnapshot();
});

test("Skills defaults to level 1", async () => {
  const store = await fsStore();

  const servant = newServant();
  servant.skills[0].target = 10;

  const requirements = newRequirements();
  addServantRequirements(requirements, store, servant, store.servantLookup.get(servant.id)!);
  expect(requirements).toMatchSnapshot();
});

test("Computes levelling materials", async () => {
  const store = await fsStore();

  const servant = newServant();
  servant.level = { current: 1, target: 90 };

  const requirements = newRequirements();
  addServantRequirements(requirements, store, servant, store.servantLookup.get(servant.id)!);
  expect(requirements).toMatchSnapshot();
});

test("Level defaults to 1", async () => {
  const store = await fsStore();

  const servant = newServant();
  servant.level.target = 1;

  const requirements = newRequirements();
  addServantRequirements(requirements, store, servant, store.servantLookup.get(servant.id)!);
  expect(requirements).toMatchSnapshot();
});

test("Computes grailing materials (80..100)", async () => {
  const store = await fsStore();

  const servant = newServant();
  servant.level = { current: 80, target: 100 };

  const requirements = newRequirements();
  addServantRequirements(requirements, store, servant, store.servantLookup.get(servant.id)!);
  expect(requirements).toMatchSnapshot();
});

test("Computes grailing materials (90..100)", async () => {
  const store = await fsStore();

  const servant = newServant();
  servant.level = { current: 90, target: 100 };

  const requirements = newRequirements();
  addServantRequirements(requirements, store, servant, store.servantLookup.get(servant.id)!);
  expect(requirements.items.get(grailId)).toEqual(5);
});

test("Computes grailing materials (92..100)", async () => {
  const store = await fsStore();

  const servant = newServant();
  servant.level = { current: 92, target: 100 };

  const requirements = newRequirements();
  addServantRequirements(requirements, store, servant, store.servantLookup.get(servant.id)!);
  expect(requirements.items.get(grailId)).toEqual(4);
});

test("Computes grailing materials (93..100)", async () => {
  const store = await fsStore();

  const servant = newServant();
  servant.level = { current: 93, target: 100 };

  const requirements = newRequirements();
  addServantRequirements(requirements, store, servant, store.servantLookup.get(servant.id)!);
  expect(requirements.items.get(grailId)).toEqual(3);
});

test("Computes lvl 120 materials", async () => {
  const store = await fsStore();

  const servant = newServant();
  servant.level = { current: 90, target: 120 };

  const requirements = newRequirements();
  addServantRequirements(requirements, store, servant, store.servantLookup.get(servant.id)!);
  expect(requirements).toMatchSnapshot();
});
