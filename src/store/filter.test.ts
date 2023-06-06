import { newServant } from ".";
import { type OwnedServant, Priority } from "../data";
import { defaultFilters, matchesFilter } from "./filter";

test("Servants are filtered based on priority", () => {
  expect(matchesFilter(
    defaultFilters,
    { ...newServant(), priority: Priority.Low },
  )).toEqual(true);

  expect(matchesFilter(
    { ...defaultFilters, priority: { ...defaultFilters.priority, [Priority.Low]: false } },
    { ...newServant(), priority: Priority.Low },
  )).toEqual(false);

  expect(matchesFilter(
    { ...defaultFilters, priority: { ...defaultFilters.priority, [Priority.Low]: false } },
    { ...newServant(), priority: Priority.High },
  )).toEqual(true);
});

test("Servants without targets are considered non-maxed", () => {
  expect(matchesFilter({ ...defaultFilters, maxed: false }, newServant())).toEqual(true);
});

test("Servants without targets for append skills are considered maxed", () => {
  expect(matchesFilter({ ...defaultFilters, maxed: false }, newMaxedServant())).toEqual(false);
});

const newMaxedServant = (): OwnedServant => ({
  ...newServant(),
  level: { current: 1, target: 1 },
  skills: [{ current: 1, target: 1 }, { current: 1, target: 1 }, { current: 1, target: 1 }],
});

test("Maxed servants are filtered out", () => {
  const filter = { ...defaultFilters, maxed: false };

  let servant: OwnedServant;

  servant = newMaxedServant();
  expect(matchesFilter(filter, servant)).toEqual(false);

  servant = newMaxedServant();
  servant.level = { current: 0, target: 1 };
  expect(matchesFilter(filter, servant)).toEqual(true);

  servant = newMaxedServant();
  servant.skills[0] = { current: 1, target: 1 };
  expect(matchesFilter(filter, servant)).toEqual(false);

  servant = newMaxedServant();
  servant.skills[0] = { current: 1, target: 2 };
  expect(matchesFilter(filter, servant)).toEqual(true);

  servant = newMaxedServant();
  servant.appendSkills[0] = { current: 1, target: 2 };
  expect(matchesFilter(filter, servant)).toEqual(true);
});
