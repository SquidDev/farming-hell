import { Dialog, Transition } from "@headlessui/react";
import { Fragment, type FunctionComponent, type ReactNode } from "react";

import { classNames } from "./utils";

const WrappedDialog: FunctionComponent<{ isOpen: boolean, setOpen: (open: boolean) => void, className?: string, children: ReactNode }> = ({ isOpen, setOpen, className, children }) =>
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog
      as="div"
      className="fixed inset-0 z-10 overflow-y-auto"
      onClose={() => setOpen(false)}
    >
      <div className="min-h-screen px-4 text-center">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay className="fixed inset-0 bg-opacity-80 bg-black" />
        </Transition.Child>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="inline-block h-screen align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className={classNames(
            "inline-block w-full p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl",
            className,
          )}>
            {children}
          </div>
        </Transition.Child>
      </div>
    </Dialog>
  </Transition>;

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
