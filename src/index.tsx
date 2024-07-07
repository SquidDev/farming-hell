import { type FunctionComponent, type ReactNode, StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Menu, MenuButton, MenuItem, MenuItems, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

import type { DataDump, Servant } from "./data";
import ServantInputs from "./manage";
import { Store, artoriaPendragon, localStore } from "./store";
import RequirementTable from "./items/RequirementTable";
import { Icon, classNames } from "./support/utils";
import servantDataUrl from "../_build/data/dump.json";
import { About, Instructions } from "./about";
import WrappedDialog from "./support/dialog";
import { read as readJson, write as writeJson } from "./store/formats/json";
import { write as writeCsv } from "./store/formats/csv";
import { loadFromFile, storeToFile } from "./import";
import { Export as ExportWebcrow, Import as ImportWebcrow } from "./import/webcrow";

import "./styles.css";


const tabClassName = ({ selected }: { selected: boolean }): string => {
  return classNames("p-2", "rounded-lg", "shadow-md", selected ? "bg-white" : "bg-blue-200 hover:bg-blue-100");
};

const MenuWrapper: FunctionComponent<{ title: string, children: ReactNode }> = ({ title, children }) =>
  <Menu as="div" className="relative lg:w-full">
    <MenuButton className={classNames("lg:w-full", tabClassName({ selected: false }))}>{title}</MenuButton>
    <MenuItems
      as="ul"
      className={classNames(
        "absolute right-0 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 w-56 border-2 border-blue-200",
        "z-100", // z-100 to be above requirements table
        "lg:bottom-full lg:mb-1 lg:w-3/4 xl:w-3/5", // On large screens, this should pop to the top (so margin below)
        "mt-1", // Otherwise pop below (so margin above)
      )}>
      {children}
    </MenuItems>
  </Menu>;

const MenuItemContents: FunctionComponent<{ children: ReactNode } & JSX.IntrinsicElements["button"]> = ({ children, ...props }) =>
  <button
    type="button"
    {...props}
    className={classNames(
      "bg-white hover:bg-blue-100 data-[focus]:bg-blue-100",
      "flex w-full p-2 text-left"
    )}
  >{children}</button>;

const Branding: FunctionComponent<{ servant: Servant }> = ({ servant }) =>
  <div className="hidden lg:block lg:mb-2 text-white lg:w-full">
    <div className="flex flex-row items-center gap-2">
      <Icon className="w-20 h-20 squircle" src={servant.ascensions[0]} alt="Farming hell simulator" />
      <span className="xl:text-xl lg:text-lg">Farming Hell</span>
    </div>
    <hr className="lg:mt-2" />
  </div>;

const MainControl: FunctionComponent<{ store: Store }> = ({ store }) => {
  const artoria = store.servantLookup.get(artoriaPendragon)!;

  const [dialogue, setDialogue] = useState<{ open: boolean, contents?: JSX.Element }>({ open: false });
  const setDialogueOpen = useCallback((open: boolean) => setDialogue(x => ({ ...x, open })), [setDialogue]);
  const openDialogue = useCallback((r: JSX.Element) => setDialogue({ open: true, contents: r }), [setDialogue]);

  return <TabGroup as="div" className="flex flex-col gap-2 lg:flex-row lg:gap-4 lg:h-screen">
    <TabList className="bg-blue-500 p-2 flex justify-between gap-2 mb-4 lg:flex-col lg:w-1/5 xl:w-1/6 2xl:max-w-xs lg:h-full">
      <div className="flex lg:flex-col items-start gap-2">
        <Branding servant={artoria} />
        <Tab className={s => classNames("lg:w-full", tabClassName(s))}>Servants</Tab>
        <Tab className={s => classNames("lg:w-full", tabClassName(s))}>Materials</Tab>
      </div>

      <div className="flex lg:flex-col items-start gap-2">
        <MenuWrapper title="Import">
          <MenuItem><MenuItemContents onClick={() => loadFromFile(store, readJson, "application/json")}>Load from JSON</MenuItemContents></MenuItem>
          <MenuItem><MenuItemContents onClick={() => openDialogue(<ImportWebcrow store={store} setOpen={setDialogueOpen} />)}>Import from FGO Material Simulator</MenuItemContents></MenuItem>
        </MenuWrapper>
        <MenuWrapper title="Export">
          <MenuItem><MenuItemContents onClick={() => storeToFile(store, writeJson, "fgo-planner.json", "application/json")}>Save as JSON</MenuItemContents></MenuItem>
          <MenuItem><MenuItemContents onClick={() => storeToFile(store, writeCsv, "fgo-planner.csv", "text/csv")}>Save as CSV</MenuItemContents></MenuItem>
          <MenuItem><MenuItemContents onClick={() => openDialogue(<ExportWebcrow store={store} setOpen={setDialogueOpen} />)}>Export Servants to FGO Material Simulator</MenuItemContents></MenuItem>
        </MenuWrapper>
        <MenuWrapper title="Help">
          <MenuItem><MenuItemContents onClick={() => openDialogue(<About />)}>About</MenuItemContents></MenuItem>
          <MenuItem><MenuItemContents onClick={() => openDialogue(<Instructions />)}>Instructions</MenuItemContents></MenuItem>
        </MenuWrapper>
      </div>
    </TabList>

    <TabPanels as="div" className="overflow-y-auto lg:pr-4 lg:flex-grow">
      <TabPanel><ServantInputs store={store} openDialogue={openDialogue} /></TabPanel>
      <TabPanel><RequirementTable store={store} /></TabPanel>
    </TabPanels>

    {<WrappedDialog isOpen={dialogue.open} setOpen={setDialogueOpen} className="max-w-5xl">{dialogue.contents}</WrappedDialog>}
  </TabGroup>;
};

const Document: FunctionComponent = function Document() {
  const [store, setStore] = useState<Store>();
  useEffect(() => {
    void (async () => {
      const contents = await fetch(servantDataUrl);
      const data = await contents.json() as DataDump;
      setStore(localStore(data));
    })();
  }, []);

  return store ? <MainControl store={store} /> : <div className="flex justify-center items-center h-screen">
    <div className="max-w-md text-xl text-gray-700 p-2">
      Fetching servant list. If you can still read this, something has probably gone wrong.
    </div>
  </div>;
};

createRoot(document.getElementById("container")!).render(<StrictMode><Document /></StrictMode>);
