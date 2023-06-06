import { type Filters, type OwnedServant, Priority, type Target } from "../data";

export const defaultFilters: Filters = Object.freeze({
  maxed: true,
  priority: Object.freeze({
    [Priority.High]: true,
    [Priority.Medium]: true,
    [Priority.Low]: true,
    [Priority.Unsummoned]: true,
  }),
});

const isMaxed = ({ current, target }: Target): boolean => current !== undefined && target !== undefined && current === target;
const isMaxedLax = ({ current, target }: Target): boolean => current === target;

export const matchesFilter = (filters: Filters, servant: OwnedServant): boolean => {
  if (filters.priority[servant.priority] === false) return false;

  return filters.maxed || !isMaxed(servant.level) || !servant.skills.every(isMaxed) || !servant.appendSkills.every(isMaxedLax);
};
