import { useField } from "formik";
import { createElement } from "react";
import { create as render } from "react-test-renderer";

import { ServantInput } from ".";
import type { OwnedServant } from "../data";
import { Store, newServant } from "../store";
import { fsStore } from "../test";

const newStoreAndServant = async (): Promise<[Store, OwnedServant]> => {
  const store = await fsStore();
  const servant = newServant();
  store.ownedServants.push(servant);
  return [store, servant];
};

// There's a weird Jest(?) bug where our input mock causes the react-fast-compare
// import to fail.
jest.mock("react-fast-compare", () => {
  const module: typeof import("react-fast-compare") = jest.requireActual("react-fast-compare");
  return { __esModule: true, default: module };
});

// Mock out some of the really noisy stuff
jest.mock("./ServantSelect", () => ({
  __esModule: true,
  default: () => createElement("ServantSelect"),
}));

jest.mock("../support/input", () => {
  const module: typeof import("../support/input") = jest.requireActual("../support/input");
  return {
    __esModule: true,
    ...module,
    Input: ({ name, placeholder }: { name: string, placeholder?: string }) => {
      const [field, _meta, _helpers] = useField<string>(name);
      return createElement("Input", { value: field.value, placeholder });
    },
  };
});

jest.mock("../items/requirements", () => ({
  __esModule: true,
  ShortServantRequirements: () => createElement("ShortServantRequirements"),
}));

jest.mock("../support/feature-detect", () => ({
  __esModule: true,
  isTouch: false,
}));

it("renders the empty servant correctly", async () => {
  const [store, servant] = await newStoreAndServant();

  const tree = render(<ServantInput servant={servant} store={store} />);
  expect(tree.toJSON()).toMatchSnapshot();
});

describe("Ascension and levels", () => {
  it("infers a servant's ascension correctly", async () => {
    const [store, servant] = await newStoreAndServant();
    servant.level = { current: 1, target: 90 };

    const tree = render(<ServantInput servant={servant} store={store} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it("supports mixed ascension and level", async () => {
    const [store, servant] = await newStoreAndServant();
    servant.level = { current: 1, target: 90 };
    servant.ascension.current = 4;

    const tree = render(<ServantInput servant={servant} store={store} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
