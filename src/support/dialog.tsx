import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import type { FunctionComponent, ReactNode } from "react";

import { classNames } from "./utils";

const WrappedDialog: FunctionComponent<{ isOpen: boolean, setOpen: (open: boolean) => void, className?: string, children: ReactNode }> = ({ isOpen, setOpen, className, children }) =>
  <Dialog
    as="div"
    className="fixed inset-0 z-10 overflow-y-auto transition duration-300 ease-out data-[closed]:opacity-0"
    open={isOpen}
    onClose={() => setOpen(false)}
    transition
  >
    <DialogBackdrop transition className="fixed inset-0 bg-opacity-80 bg-black" />
    <div className="relative inset-0 flex w-screen items-center justify-center p-4">
      <DialogPanel className={classNames(
        "inline-block w-full p-6 my-8 overflow-hidden text-left align-middle bg-white shadow-xl rounded-2xl",
        className,
      )}>
        {children}
      </DialogPanel>
    </div>
  </Dialog>;

export default WrappedDialog;

export const DialogTitle = Dialog.Title;

export const DialogButton: FunctionComponent<JSX.IntrinsicElements["button"]> =
  ({ className, children, ...attrs }) =>
    <button
      type="button"
      className={classNames(
        "inline-flex justify-center px-4 py-2 text-sm font-medium border border-transparent rounded-md",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className ?? "hover:bg-blue-200 text-blue-900 bg-blue-100 focus-visible:ring-blue-500"
      )}
      {...attrs}
    >
      {children}
    </button>;
