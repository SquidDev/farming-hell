import { useField } from "formik";
import { FunctionComponent, useMemo } from "react";
import Select, { OptionProps, StylesConfig, components } from "react-select";

import type { IdMap, Servant } from "../data";

type ServantOption = {
  label: string,
  value: string,
  servant: Servant,
}

const ServantOption: FunctionComponent<OptionProps<ServantOption>> = props => {
  const servant = props.data.servant;
  return <components.Option {...props}>
    <div className="flex items-center">
      <img className="w-8 h-8 mr-1 squircle" alt={servant.name} src={servant.ascensions[0]} width="128" height="128" />
      <span className="flex-grow">{servant.name}</span>
    </div>
  </components.Option>;
};

const makeServant = (servant: Servant): ServantOption => ({
  value: `${servant.id}`,
  label: servant.name,
  servant,
});

const styleOverrides: StylesConfig<ServantOption, false> = {
  menu: provided => ({
    ...provided,
    "z-index": 100,
  })
};

/**
 * A {@code <select>}-style input to pick servants.
 */
const ServantSelect: FunctionComponent<{ name: string, className: string, servants: IdMap<Servant> }> = ({ name, servants, className }) => {
  const [field, _meta, helpers] = useField<string>(name);

  const options: Array<ServantOption> = useMemo(() => {
    // TODO: Cache this. It's global for the whole store.
    const options: Array<ServantOption> = [];
    servants.forEach(x => options.push(makeServant(x)));
    return options;
  }, [servants]);

  // Select performs an exact match, so we need to ensure we have the same object. Complete disaster.
  const currentServant: ServantOption | undefined = options.find(x => x.value === `${field.value}`);

  return <Select<ServantOption, false>
    value={currentServant}
    onChange={e => helpers.setValue(e?.value ?? "")}
    options={options}
    components={{ Option: ServantOption }}
    className={className}
    styles={styleOverrides}
  />;
};

export default ServantSelect;
