import { useField } from "formik";
import { FunctionComponent, ReactNode, useState } from "react";
import { Combobox } from "@headlessui/react";

import { IdMap, Servant, makeId } from "../data";
import { classNames } from "../support/utils";

const makeServants = (query: string, servants: IdMap<Servant>): ReactNode => {
  query = query.toLowerCase();

  const options: Array<ReactNode> = [];
  servants.forEach(servant => {
    if (!servant.name.toLowerCase().includes(query)) return;

    options.push(<Combobox.Option key={servant.id} value={servant} className={({ active, selected }) => classNames(
      "flex items-center p-2",
      selected ? "bg-blue-600" : (active ? "bg-blue-100" : undefined)
    )}>
      <img className="w-8 h-8 mr-1 squircle" alt={servant.name} src={servant.ascensions[0]} width="128" height="128" loading="lazy" />
      <span className="flex-grow">{servant.name}</span>
    </Combobox.Option>);
  });
  return options;
};

const Chevron: FunctionComponent = () =>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-2 w-2">
    <path style={{ fill: "#000" }} d="M507.344,154.765c-7.713-10.283-22.301-12.367-32.582-4.655L256.005,314.182L37.238,150.111
	c-10.283-7.713-24.869-5.626-32.582,4.655c-7.713,10.282-5.627,24.871,4.655,32.582l232.732,174.544
	c4.138,3.103,9.05,4.655,13.964,4.655c4.912,0,9.826-1.552,13.964-4.655l232.72-174.544
	C512.971,179.636,515.056,165.048,507.344,154.765z"/>
  </svg>;

/**
 * A {@code <select>}-style input to pick servants.
 */
const ServantSelect: FunctionComponent<{ name: string, className: string, servants: IdMap<Servant> }> = ({ name, servants, className }) => {
  const [field, _meta, helpers] = useField<string>(name);
  const [query, setQuery] = useState("");

  // Select performs an exact match, so we need to ensure we have the same object. Complete disaster.
  const id = parseInt(field.value);
  const currentServant: Servant | undefined = id === id ? servants.get(makeId("servant", id)) : undefined;

  return <Combobox value={currentServant} onChange={x => { console.log("On change", x?.id); helpers.setValue(x ? `${x.id}` : ""); }}>{({ open }) => <>
    <div className={classNames("relative", className)}>
      <Combobox.Input<"input", Servant | undefined>
        onChange={event => setQuery(event.target.value)}
        displayValue={x => x ? x.name : ""}
        onFocus={e => e.target.setSelectionRange(0, e.target.value.length)}
        className="w-full p-1 rounded-lg border focus:ring-2 focus:ring-indigo-500 hover:ring-2 hover:ring-indigo-400"
      />
      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
        <Chevron />
      </Combobox.Button>
    </div>
    {open && <div className="relative"><Combobox.Options static
      className="absolute w-full max-h-64 bg-white overflow-y-auto z-30 border-1 border-gray-400 py-1"
    >
      {makeServants(query, servants)}
    </Combobox.Options></div>}
  </>
  }
  </Combobox>;
};

export default ServantSelect;
