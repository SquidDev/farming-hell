import { Field, Formik, useField } from "formik";
import { action, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { type FunctionComponent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Sortable, { type SortableEvent } from "sortablejs";

import { type CardColour, type Filters, type OwnedServant, Priority, type Servant, type Skill, type Target } from "../data";
import { ownedServant } from "../data/schema";
import { ShortServantRequirements, ShowDifference } from "../items/requirements";
import { Store, newServant } from "../store";
import { matchesFilter } from "../store/filter";
import WrappedDialog, { DialogButton, DialogTitle } from "../support/dialog";
import { Checkbox, Input, SubmitOnChange } from "../support/input";
import { Icon, LinkButton, classNames } from "../support/utils";
import ServantSelect from "./ServantSelect";
import { getAscensionTarget } from "../data/ascension";
import { Instructions } from "../about";
import { isTouch } from "../support/feature-detect";

const priorities: ReactNode = ["High", "Medium", "Low", "Unsummoned"].map(x => <option key={x} value={x}>{x}</option>);

const placeholderZero: Target = { current: 0 };
const placeholderOne: Target = { current: 1 };

const undefinedToString = (x: number | undefined): string | undefined => x === undefined ? undefined : `${x}`;

const TargetInput: FunctionComponent<{ path: string, label?: string, children: ReactNode, successStyle: string, placeholder: Target }> = ({ path, label, children, successStyle, placeholder }) => {
  const [{ value: current }, _meta, _helpers] = useField<string>(`${path}.current`);
  const [{ value: target }, _meta2, _helpers2] = useField<string>(`${path}.target`);

  // Behold this ungodly mess of coercions.
  const { current: placeholderCurrent, target: placeholderTarget } = placeholder;
  const effectiveCurrent = current || (placeholderCurrent === undefined ? "" : `${placeholderCurrent}`);
  const effectiveTarget = target || (placeholderTarget === undefined ? "" : `${placeholderTarget}`);
  const isOk = effectiveCurrent && effectiveTarget && effectiveCurrent === effectiveTarget;

  return <div className={classNames(isOk ? successStyle : undefined, "rounded-md")}>
    <div className="flex flex-col p-2">
      <span className="text-xl"> {label} </span>
      <div className="flex">
        <Input name={`${path}.current`} className="w-12 p-1 rounded-l-lg" type="text" inputMode="numeric" pattern="[0-9]*" placeholder={undefinedToString(placeholder.current)}>
          {children}
        </Input>
        <Input name={`${path}.target`} className="w-12 p-1 rounded-r-lg" type="text" inputMode="numeric" pattern="[0-9]*" placeholder={undefinedToString(placeholder.target)}>
          {children}
        </Input>
      </div>
    </div>
  </div>;
};

const SkillInput: FunctionComponent<{ path: string, skill?: Array<Skill>, successStyle: string, placeholder: Target }> = ({ path, skill, successStyle, placeholder }) => {
  return <TargetInput path={path} successStyle={successStyle} placeholder={placeholder}>
    {skill
      ? skill.map(skill => <div key={skill.id}>
        <h3 className="text-md font-semibold">{skill.name}</h3>
        <div className="flex">
          <Icon className="mr-2 mb-2 w-8 h-8" src={skill.icon} alt={skill.name} />
          <p>{skill.detail}</p>
        </div>
      </div>)
      : null}
  </TargetInput>;
};

const ascensions: Array<{ lvl: number, label: string }> = [
  { lvl: 0, label: "1" },
  { lvl: 1, label: "2" },
  { lvl: 2, label: "3" },
  { lvl: 3, label: "4" },
  { lvl: 4, label: "Max" },
];

const LevelOrAscensionInput: FunctionComponent<{ label: string, servant?: Servant, path: string, successStyle: string, placeholder: Target }> = ({ label, servant, path, successStyle, placeholder }) =>
  <TargetInput label={label} path={path} successStyle={successStyle} placeholder={placeholder}>
    <table>
      <thead>
        <tr className="border-b border-white font-semibold">
          <th className="text-right border-r border-white px-1">Ascension</th>
          <th className="px-1">Level</th>
        </tr>
      </thead>
      <tbody>
        {ascensions.map(({ lvl, label }) => <tr key={lvl}>
          <td className="text-right border-r border-white px-1">{label}</td>
          <td className="px-1">{servant?.lvlMax[lvl] ?? "?"}</td>
        </tr>)}
      </tbody>
    </table>
  </TargetInput>;

// There's a mismatch here between ascension artwork (1..4) and ascensions
// (0..4). Stages 1 and 2 both use the second ascension artwork.
const ascensionMapping = [0, 1, 1, 2, 3];

const npStyles: { [np in CardColour]: { container: string, success: string } } = {
  arts: { container: "bg-blue-200 border-blue-500", success: "bg-green-200" },
  quick: { container: "bg-green-200 border-green-500", success: "bg-blue-200" },
  buster: { container: "bg-red-200 border-red-500", success: "bg-green-200" },
};

export type TargetData = {
  current: string,
  target: string,
}

type ServantData = {
  id: string,
  priority: Priority,
  level: TargetData,
  ascension: TargetData,
  skills: Array<TargetData>,
  appendSkills: Array<TargetData>,
}

const DeleteDialogue: FunctionComponent<{ isOpen: boolean, setOpen: (open: boolean) => void, servant: OwnedServant, store: Store }> = observer(function DeleteDialogue({ isOpen, setOpen, servant, store }) {
  const servantDetails = store.servantLookup.get(servant.id);

  const deleteServant = action(() => {
    const idx = store.ownedServants.findIndex(x => x.uid === servant.uid);
    if (idx >= 0) store.ownedServants.splice(idx, 1);
  });
  return <WrappedDialog isOpen={isOpen} setOpen={setOpen} className="max-w-md">
    <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900">
      Delete {servantDetails ? servantDetails.name : "servant"}?
    </DialogTitle>
    <div className="mt-4 flex justify-end gap-2">
      <DialogButton onClick={() => setOpen(false)}>Cancel</DialogButton>
      <DialogButton
        onClick={deleteServant}
        className="text-red-900 bg-red-200 hover:bg-red-300 focus-visible:ring-red-500"
      >
        Delete
      </DialogButton>

    </div>
  </WrappedDialog>;
});

/** Main servant input form. */
export const ServantInput: FunctionComponent<{ servant: OwnedServant, store: Store }> = observer(function ServantInput({ servant: storeServant, store }) {
  // Take a copy of the servant with no undefined values.
  const formServant: ServantData = useMemo(() => ({
    id: `${storeServant.id}`,
    priority: storeServant.priority,
    level: { current: `${storeServant.level.current ?? ""}`, target: `${storeServant.level.target ?? ""}` },
    ascension: { current: `${storeServant.ascension.current ?? ""}`, target: `${storeServant.ascension.target ?? ""}` },
    skills: storeServant.skills.map(x => ({ current: `${x.current ?? ""}`, target: `${x.target ?? ""}` })),
    appendSkills: storeServant.appendSkills.map(x => ({ current: `${x.current ?? ""}`, target: `${x.target ?? ""}` })),
  }), [storeServant]);

  const onSubmit = useMemo(() => action<(f: ServantData) => void>(values => {
    const updatedServant = ownedServant.validateSync(values) as OwnedServant;
    for (const k of (["id", "priority", "level", "ascension", "skills", "appendSkills"] as Array<keyof OwnedServant>)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (storeServant as any)[k] = updatedServant[k]; // TODO: Do this in a more safe manner!
    }
  }), [storeServant]);

  const [showClose, setShowClose] = useState(false);

  const servantDetails = store.servantLookup.get(storeServant.id);
  const npStyle = npStyles[servantDetails?.npType ?? "arts"];

  const inferredAscension = servantDetails !== undefined ? getAscensionTarget(servantDetails, storeServant) : placeholderZero;
  const ascension = servantDetails?.ascensions[ascensionMapping[inferredAscension.current ?? 0]];

  return <Formik
    initialValues={formServant}
    onSubmit={onSubmit}
    validateOnChange={true}
    validationSchema={ownedServant}
  >{form => <>
      <div className="flex flex-col items-center sm:flex-row sm:items-start flex-nowrap gap-2 mb-4">
        {servantDetails && ascension
          ? <Icon className="w-20 h-20 squircle" src={ascension} alt={servantDetails.name} />
          : undefined}

        <div className="w-full flex flex-col flex-grow justify-center">
          <ServantSelect name="id" className="mb-1" servants={store.servantLookup} />
          <Field
            name="priority" component="select"
            className="bg-white p-1 rounded-lg border focus:ring-2 focus:ring-indigo-500 hover:ring-2 hover:ring-indigo-400"
          >{priorities}</Field>
        </div>

        {isTouch && <div
          className={classNames(
            "h-6 flex items-center justify-center order-first sm:order-last",
            "text-gray-900 hover:text-gray-600 cursor-grab",
          )}
          data-handle="yes"
        >⣿</div>}
      </div>

      <div className="flex flex-col flex-grow">
        <div className="flex flex-row flex-wrap mt-2 gap-2 2xl:gap-1">
          <LevelOrAscensionInput successStyle={npStyle.success} label="Level" path="level" servant={servantDetails} placeholder={placeholderOne} />
          <LevelOrAscensionInput
            successStyle={npStyle.success} label="Ascension" path="ascension" servant={servantDetails}
            placeholder={inferredAscension} />
        </div>

        <div className="flex flex-col mt-2">
          <span className="text-xl px-2"> Skills </span>
          <div className="flex flex-wrap gap-2 2xl:gap-1">
            <SkillInput successStyle={npStyle.success} path={"skills[0]"} skill={servantDetails?.skills[0]} placeholder={placeholderOne} />
            <SkillInput successStyle={npStyle.success} path={"skills[1]"} skill={servantDetails?.skills[1]} placeholder={placeholderOne} />
            <SkillInput successStyle={npStyle.success} path={"skills[2]"} skill={servantDetails?.skills[2]} placeholder={placeholderOne} />
          </div>
        </div>

        <div className="flex flex-col mt-2">
          <span className="text-xl px-2"> Append Skills </span>
          <div className="flex flex-wrap gap-2 2xl:gap-1">
            <SkillInput successStyle={npStyle.success} path={"appendSkills[0]"} skill={servantDetails?.appendSkills[0]} placeholder={placeholderZero} />
            <SkillInput successStyle={npStyle.success} path={"appendSkills[1]"} skill={servantDetails?.appendSkills[1]} placeholder={placeholderZero} />
            <SkillInput successStyle={npStyle.success} path={"appendSkills[2]"} skill={servantDetails?.appendSkills[2]} placeholder={placeholderZero} />
          </div>
        </div>

        <DeleteDialogue isOpen={showClose} setOpen={setShowClose} servant={storeServant} store={store} />

        <div className="mt-2">
          <ShortServantRequirements servant={storeServant} store={store} />
        </div>
      </div>

      <button
        type="button"
        className={classNames(
          "absolute top-1 left-1 text-2xl w-6 h-6 flex items-center justify-center",
          "rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-900 hover:text-gray-600",
        )}
        onClick={() => setShowClose(true)}
      >&times;</button>

      <SubmitOnChange formik={form} />
    </>}</Formik>;
});

/**
 * Wrapper over the servant input form. The various drag-n-drop components cause this component to render twice on
 * initial load. This does not play well with Formik and causes a render cascade with all children.
 *
 * To avoid that we chuck them in their own dedicated wrapper. This prevents rerendering formik unless the servant
 * changes (which is still more often than I'd like but doesn't happen 100+ of times in a page load).
 */
const ServantInputContainer: FunctionComponent<{ servant: OwnedServant, store: Store }> = observer(function ServantInputContainer({ servant: storeServant, store }) {
  const servantDetails = store.servantLookup.get(storeServant.id);
  const npStyle = npStyles[servantDetails?.npType ?? "arts"];

  const shouldShow = matchesFilter(store.filters, storeServant);

  return <div className={classNames(
    `p-3 rounded-md border-2 ${npStyle.container} flex-col shadow-md relative`,
    shouldShow ? "flex" : "hidden"
  )}>
    <ServantInput servant={storeServant} store={store} />
  </div>;
});

const NewServantButton: FunctionComponent<{ className?: string, store: Store }> = ({ className, store }) => {
  return <div
    className={classNames("flex flex-row items-center justify-center", className)}
    onMouseDown={() => null}
    data-filter
  >
    <button
      type="button"
      className="w-24 h-24 leading-24 rounded-full bg-blue-200 text-blue-800 hover:bg-blue-300 hover:ring-2 hover:ring-offset-2 hover:ring-blue-800 transition-shadow"
      onClick={() => store.ownedServants.push(newServant())}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <path
          className="fill-current stroke-current"
          d="M38.5 25H27V14c0-.553-.448-1-1-1s-1 .447-1 1v11H13.5c-.552 0-1 .447-1 1s.448 1 1 1H25v12c0 .553.448 1 1 1s1-.447 1-1V27h11.5c.552 0 1-.447 1-1s-.448-1-1-1z" />
      </svg>
    </button>
  </div>;
};

const ServantFilter: FunctionComponent<{ store: Store }> = observer(function ServantFilter({ store }) {
  return <Formik
    initialValues={toJS(store.filters)}
    onSubmit={action<(f: Filters) => void>(values => store.filters = values)}>{form =>
      <div className="flex justify-between flex-col sm:flex-row gap-3 p-6 lg:p-0 lg:py-4 container mx-auto">
        <Checkbox name="maxed">Include maxed servants?</Checkbox>

        <fieldset className="flex gap-3 flex-wrap">
          {[Priority.High, Priority.Medium, Priority.Low, Priority.Unsummoned]
            .map(x => <Checkbox key={x} name={`priority.${x}`}>{x}</Checkbox>)}
          <SubmitOnChange formik={form} />
        </fieldset>
      </div>
    }</Formik>;
});

const NewServantPrompt: FunctionComponent<{ openDialogue: (r: JSX.Element) => void }> = ({ openDialogue }) =>
  <div data-filter>
    <p>
      It looks like you don&apos;t have any servants! Press the plus button to add one, or
      see <LinkButton onClick={() => openDialogue(<Instructions />)}>the instructions</LinkButton> for more details.
    </p>
  </div>;

const ServantInputs: FunctionComponent<{ store: Store, openDialogue: (r: JSX.Element) => void }> = observer(function ServantInputs({ store, openDialogue }) {
  const move = useMemo(() => action<(event: SortableEvent) => void>(event => {
    const { oldDraggableIndex: from, newDraggableIndex: to } = event;
    if (from === undefined || to === undefined) return;
    if (from >= store.ownedServants.length || to >= store.ownedServants.length) return;

    store.ownedServants.splice(to, 0, store.ownedServants.splice(from, 1)[0]);
  }), [store]);

  const [difference, setDifference] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if(event.code === "ShiftLeft" || event.code === "ShiftRight") setDifference(event.type === "keydown");
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", handler);
    };
  }, []);

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current === null) return undefined;
    const sort = Sortable.create(ref.current, {
      onUpdate: move,
      handle: isTouch ? "[data-handle]" : undefined,
      filter: (_event, target) => target.getAttribute("data-filter") !== null,
      onMove: event => event.related.getAttribute("data-filter") === null,
    });
    return () => sort.destroy();
  }, [ref, move]);

  return <ShowDifference.Provider value={difference}>
    <ServantFilter store={store} />
    <div className="grid md:grid-cols-[repeat(auto-fit,minmax(25em,1fr))] grid-cols-1 gap-4 p-6 lg:p-0 lg:py-4 container mx-auto" ref={ref}>
      {store.ownedServants.map(s => <ServantInputContainer key={s.uid} servant={s} store={store} />)}
      <NewServantButton store={store} />
      {store.ownedServants.length === 0 && <NewServantPrompt openDialogue={openDialogue} />}
    </div>
  </ShowDifference.Provider>;
});

export default ServantInputs;
