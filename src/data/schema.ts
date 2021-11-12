import * as yup from "yup";

import type { Id, OwnedServant, Priority, Target } from ".";

// Disable all the "any" linters because yup doesn't really do types.

/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

const target = (label: string, min: number, max: number): yup.SchemaOf<Target> => {
  const range = `${label} must be between ${min} and ${max}`;
  const row = yup.number().label(label).typeError(`${label} must be a number`)
    .transform((currentValue, originalValue) => {
      return originalValue === "" ? undefined : currentValue;
    })
    .min(min, range).max(max, range)
    .integer()
    .notRequired();

  return yup.object().shape({
    current: row,
    target: row.when("current", (value, schema) => {
      if (typeof value !== "number") return schema;
      return schema.min(value, "Target must be at least the current level");
    })
  });
};

export const ownedServant: yup.SchemaOf<Omit<OwnedServant, "uid">> = yup.object().shape({
  id: yup.number().positive().required() as unknown as yup.SchemaOf<Id<"servant">>,
  priority: (yup.string().oneOf(["High", "Medium", "Low", "Unsummoned"]) as unknown as yup.SchemaOf<Priority>).required(),
  level: target("Level", 1, 100),
  ascension: target("Ascension", 0, 4),
  skills: yup.array().of(target("Skill", 1, 10)).length(3),
});
