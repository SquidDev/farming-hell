import { fsStore } from "../test";

test("Has a basic list of items", async () => {
  const store = await fsStore();
  expect(store.items.filter(x => x.alwaysDisplay).map(x => `${x.id} => ${x.name}`)).toMatchSnapshot();
});
