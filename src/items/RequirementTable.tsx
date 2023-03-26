import { observer } from "mobx-react-lite";
import { FunctionComponent, ReactNode, Reducer, useCallback, useMemo, useReducer } from "react";
import * as yup from "yup";
import { Formik } from "formik";
import { action } from "mobx";
import { Disclosure, Tab } from "@headlessui/react";

import type { Store } from "../store";
import { Item, Priority } from "../data";
import { ExternalLink, Icon, classNames } from "../support/utils";
import { formatValue } from "./item";
import { Requirements, addSplitServantRequirements, newRequirements } from "../data/requirements";
import { Input, SubmitOnChange } from "../support/input";

type OwnedItem = { count?: number }

const ownedItem: yup.Schema<OwnedItem> = yup.object().shape({
  count: yup.number().min(0, "Must be a positive number").integer(),
});

const ReverseDeps: FunctionComponent<{ getter: (r: Requirements) => number, store: Store }> = observer(({ getter, store }) => {
  const servants = store.ownedServants
    .map(servant => {
      const details = store.servantLookup.get(servant.id);
      if (!details) return null;

      const skills = newRequirements(), ascensions = newRequirements();
      addSplitServantRequirements(ascensions, skills, store, servant, details);

      const skill = getter(skills), ascension = getter(ascensions);
      if (skill + ascension === 0) return null;

      return <tr key={servant.uid}>
        <td><Icon className="w-8 h-8 squircle" src={details.ascensions[0]} alt={details.name} /></td>
        <td className="py-2 px-1">{details.name}</td>
        <td className="py-2 px-1 text-right">{formatValue(ascension)}</td>
        <td className="py-2 px-1 text-right">{formatValue(skill)}</td>
      </tr>;
    });

  return servants.find(x => x !== null) ? <table className="text-sm w-full">
    <thead>
      <tr>
        <th scope="col" colSpan={2} className="py-2 px-1">Servant</th>
        <th scope="col" className="py-2 px-1">Ascension</th>
        <th scope="col" className="py-2 px-1">Skills</th>
      </tr>
    </thead>
    <tbody>
      {servants}
    </tbody>
  </table> : <p className="text-sm text-gray-700 py-1">Nobody needs these materials. You&apos;re all fine!</p>;
});

const EventAppearances: FunctionComponent<{ item: Item, store: Store }> = observer(({ item, store }) => {
  if (item.events.length === 0) return <p className="text-sm text-gray-700 py-1">This item doesn&apos;t appear in any upcoming events. Sorry about that.</p>;

  const events = item.events.map(x => {
    let amount: string | number = x.amount, kind;
    if (x.kind === "lottery") {
      amount = `${x.amount}/box`;
      kind = "Lottery";
    } else if (x.kind === "mission") {
      kind = "Mission";
    } else if (x.kind === "shop") {
      kind = "Shop";
    } else if (x.kind === "quest") {
      kind = "Quest reward";
    } else {
      kind = "?";
    }

    const event = store.eventLookup.get(x.event)!;
    return <tr key={`${x.event}:${x.kind}`} className="whitespace-nowrap">
      <td className="py-2 px-1 text-right">{amount}</td>
      <td className="py-2 px-1">{kind}</td>
      <td className="py-2 px-1 max-w-xs overflow-ellipsis overflow-hidden" title={event.name}>{event.name}</td>
      <td className="py-2 px-1">{event.date}</td>
    </tr>;
  });

  return <table className="text-sm w-full">
    <thead>
      <tr>
        <th scope="col" className="py-2 px-1">Amount</th>
        <th scope="col" className="py-2 px-1">Acquisition</th>
        <th scope="col" className="py-2 px-1">Event</th>
        <th scope="col" className="py-2 px-1">Date (approx)</th>
      </tr>
    </thead>
    <tbody>{events}</tbody>
  </table>;
});

const Drops: FunctionComponent<{ item: Item }> = observer(({ item }) => {
  if (item.drops.length === 0) {
    return <p className="text-sm text-gray-700 py-1">
      No known farming locations. Why not check the <ExternalLink href="https://apps.atlasacademy.io/drop-lookup/#/">Atlas Academy Drop Lookup tool</ExternalLink>?
    </p>;
  }
  const drops = item.drops.map(drop => <tr key={`${drop.area}-${drop.quest}`}>
    <td className="py-2 px-1">{drop.area}</td>
    <td className="py-2 px-1"><ExternalLink href={drop.link}>{drop.quest}</ExternalLink></td>
    <td className="py-2 px-1 text-right">{drop.ap.toFixed(2)}</td>
    <td className="py-2 px-1 text-right">{drop.ap_drop.toFixed(2)}</td>
    <td className="py-2 px-1 text-right">{drop.drop.toFixed(2)}%</td>
  </tr>);

  return <>
    <table className="text-sm w-full">
      <thead>
        <tr>
          <th scope="col" className="py-2 px-1">Area</th>
          <th scope="col" className="py-2 px-1">Quest</th>
          <th scope="col" className="py-2 px-1">AP</th>
          <th scope="col" className="py-2 px-1">AP/drop</th>
          <th scope="col" className="py-2 px-1">Drop chance</th>
        </tr>
      </thead>
      <tbody>{drops}</tbody>
    </table>
    <p className="text-sm text-gray-700 py-1">
      All data sourced from the <ExternalLink href="https://apps.atlasacademy.io/drop-lookup/#/">Atlas Academy Drop Lookup spreadsheet</ExternalLink>.
    </p>
  </>;
});

const tabClassName = ({ selected }: { selected: boolean }): string => {
  return classNames("my-1 px-1 rounded-lg border-2", selected ? "border-blue-600" : "border-blue-200 hover:bg-blue-100");
};

const ValueWithNeeded: FunctionComponent<{ owned: number, needed: number, value: number }> = ({ owned, needed, value }) =>
  <td className={classNames("text-right py-4 px-2", owned >= needed ? "bg-green-200" : undefined)}>{formatValue(value)}</td>;

const RequiredItem: FunctionComponent<{
  item: Item, store: Store,
  requirements: number, highPriority: number, mediumPriority: number, lowPriority: number,
  getter: (r: Requirements) => number,
}> = observer(({ item, store, requirements, highPriority, mediumPriority, lowPriority, getter }) => {
  const owned = store.ownedItems.get(item.id);
  const ownedVal = owned ?? 0;

  const initialValues = useMemo(() => ({ count: owned }), [owned]);
  const onSubmit = useMemo(() => action<(f: OwnedItem) => void>(values => {
    const { count } = ownedItem.validateSync(values) ;
    if (count === undefined) {
      store.ownedItems.delete(item.id);
    } else {
      store.ownedItems.set(item.id, count);
    }
  }), [store, item]);

  return <Formik
    initialValues={initialValues}
    onSubmit={onSubmit}
    validateOnChange={true}
    validationSchema={ownedItem}
  >{form =>
      <Disclosure>
        <tr>
          <SubmitOnChange formik={form} />
          <td className="min-w-max">
            <Disclosure.Button className="w-full text-left flex items-center">
              <Icon className="w-12 h-12 inline-block mr-1" alt={item.name} src={item.icon} />
              {item.name}
            </Disclosure.Button>
          </td>
          <td>
            <Input name={"count"} className="w-12 p-1 rounded-lg" type="text" inputMode="numeric" pattern="[0-9]*">
            Have fun farming! {/* Look, this is only here because we need some content. */}
            </Input>
          </td>
          <ValueWithNeeded owned={ownedVal} needed={requirements} value={requirements} />
          <ValueWithNeeded owned={ownedVal} needed={highPriority} value={highPriority} />
          <ValueWithNeeded owned={ownedVal} needed={highPriority + mediumPriority} value={mediumPriority} />
          <ValueWithNeeded owned={ownedVal} needed={highPriority + mediumPriority + lowPriority} value={lowPriority} />
        </tr>
        <Disclosure.Panel as="tr">
          <td colSpan={6}>
            <Tab.Group>
              <Tab.List className="flex gap-2">
                <Tab className={tabClassName}>Servants</Tab>
                <Tab className={tabClassName}>Events</Tab>
                <Tab className={tabClassName}>Farming Locations</Tab>
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel><ReverseDeps getter={getter} store={store} /></Tab.Panel>
                <Tab.Panel><EventAppearances item={item} store={store} /></Tab.Panel>
                <Tab.Panel><Drops item={item} /></Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </td>
        </Disclosure.Panel>
      </Disclosure>
    }
  </Formik>;
});

type Column = "name" | "total" | "high" | "medium" | "low";
type Sorting = {
  column: Column,
  descending: boolean,
} | null;

const SortableHeader: FunctionComponent<{ column: Column, sort: Sorting, setSort: (column: Column) => void, children: ReactNode }> = ({ column, sort, setSort, children }) => {
  const callback = useCallback(() => setSort(column), [column, setSort]);
  return <th scope="col" className="py-4 px-2" aria-sort={sort?.column === column ? (sort.descending ? "descending" : "ascending") : "none"}>
    <button type="button" className="font-bold hover:text-gray-700" onClick={callback}>
      {children}
      <span role="img" className="w-6 inline-block">{sort?.column === column && (sort.descending ? "▼" : "▲")}</span>
    </button>
  </th>;
};

const sortColumn: Reducer<Sorting, Column> = (sort, column) => {
  // Sorting a new column sorts it ascending, sorting the current column either switches it to descending or cancels the
  // sort.
  if (sort === null || sort.column !== column) return { column, descending: false };
  if (!sort.descending) return { column, descending: true };
  return null;
};

/**
 * The main requirements table. We'll rewrite this one day to be a proper data-table with sorting and whatnot.
 */
const RequirementTable: FunctionComponent<{ store: Store }> = observer(function RequirementTable({ store }) {
  const requirements = store.requirements;

  const highPriority = store.getRequirements(x => x.priority === Priority.High);
  const mediumPriority = store.getRequirements(x => x.priority === Priority.Medium);
  const lowPriority = store.getRequirements(x => x.priority === Priority.Low);

  const [sort, setSort] = useReducer(sortColumn, null);

  let items: Array<{ item: Item, getter: (r: Requirements) => number }>;
  if (sort === null) {
    items = store.requirementItems;
  } else {
    const { column, descending } = sort;
    const direction = descending ? -1 : 1;
    items = [...store.requirementItems];
    items.sort((l, r) => {
      switch (column) {
        default:
        case "name": return direction * l.item.name.localeCompare(r.item.name);
        case "total": return direction * (l.getter(requirements) - r.getter(requirements));
        case "high": return direction * (l.getter(highPriority) - r.getter(highPriority));
        case "medium": return direction * (l.getter(mediumPriority) - r.getter(mediumPriority));
        case "low": return direction * (l.getter(lowPriority) - r.getter(lowPriority));
      }
    });
  }

  return <div className="w-full md:flex md:flex-col md:items-center p-6">
    <table>
      <thead className="sticky top-0 z-10 bg-gray-50 bg-opacity-90 text-gray-500 text-sm">
        <tr>
          <SortableHeader sort={sort} setSort={setSort} column="name">Item</SortableHeader>
          <th scope="col" className="py-4 px-2 font-bold">Owned</th>
          <SortableHeader sort={sort} setSort={setSort} column="total">Total</SortableHeader>
          <SortableHeader sort={sort} setSort={setSort} column="high">High</SortableHeader>
          <SortableHeader sort={sort} setSort={setSort} column="medium">Medium</SortableHeader>
          <SortableHeader sort={sort} setSort={setSort} column="low">Low</SortableHeader>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-300">
        {items.map(({ item, getter }) => {
          const total = getter(requirements);
          if (!total && !item.alwaysDisplay) return null; // Skip event items which we don't need.

          return <RequiredItem
            key={item.id} store={store} item={item} getter={getter}
            requirements={getter(requirements)} highPriority={getter(highPriority)} mediumPriority={getter(mediumPriority)} lowPriority={getter(lowPriority)} />;
        })}
      </tbody>
    </table>
  </div>;
});

export default RequirementTable;
