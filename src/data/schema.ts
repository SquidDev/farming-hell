import * as yup from "yup";

import type { Id, OwnedServant, Priority, Target } from ".";

const target = (label: string, min: number, max: number): yup.Schema<Target> => {
  const range = `${label} must be between ${min} and ${max}`;
  const row = yup.number().label(label).typeError(`${label} must be a number`)
    .transform((currentValue, originalValue): unknown => {
      return originalValue === "" ? undefined : currentValue;
    })
    .min(min, range).max(max, range)
    .integer()
    .optional();

  return yup.object().shape({
    current: row,
    target: row.when("current", (value, schema) => {
      if (typeof value !== "number") return schema;
      return schema.min(value, "Target must be at least the current level");
    })
  });
};

export const ownedServant: yup.Schema<Omit<OwnedServant, "uid">> = yup.object().shape({
  id: yup.number().positive().required() as unknown as yup.Schema<Id<"servant">>,
  priority: yup.string().oneOf(["High", "Medium", "Low", "Unsummoned"]).required() as yup.Schema<Priority>,
  level: target("Level", 1, 120),
  ascension: target("Ascension", 0, 4),
  skills: yup.array().of(target("Skill", 1, 10)).length(3).required(),
  appendSkills: yup.array().of(target("Append Skill", 0, 10)).length(3).required(),
});
