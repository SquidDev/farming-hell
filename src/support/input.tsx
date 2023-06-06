import { useFloating, offset, flip, shift } from '@floating-ui/react-dom';
import { Field, type FormikProps, type GenericFieldHTMLAttributes, useField } from "formik";
import { type FunctionComponent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import isEqual from "react-fast-compare";

import { classNames } from "./utils";

const floatingMiddleware = [offset(12), flip(), shift()];
/**
 * Custom text input control for Formik. This displays error validation messages
 * within a tooltip (which displays on focus) as well as any other custom
 * tooltip contents.
 */
export const Input: FunctionComponent<{
  name: string,
  children: ReactNode,
} & GenericFieldHTMLAttributes> = ({ name, children, className: classes, ...props }) => {
  const [_field, meta, _helpers] = useField<string>(name);

  const [isOpen, setIsOpen] = useState(false);
  const context = useFloating({
    placement: "bottom",
    open: isOpen,
    middleware: floatingMiddleware,
  });
  const onFocus = useCallback((e: FocusEvent) => setIsOpen(e.type === "focus"), [setIsOpen]);

  return <>
    <Field
      name={name}
      innerRef={context.refs.setReference}
      className={classNames(
        "border focus:ring-2 focus:ring-indigo-500 hover:ring-2 hover:ring-indigo-400",
        classes,
        meta.error ? "border-red-600" : "border-gray-300"
      )}
      onFocus={onFocus}
      onBlur={onFocus}
      {...props}
    />
    {isOpen && <div
      ref={context.refs.setFloating}
      className="z-50 bg-gray-900 bg-opacity-80 text-white text-xs w-max max-w-lg p-2 rounded"
      style={{
        position: context.strategy,
        left: context.x ?? 0,
        top: context.y ?? 0,
        width: 'max-content',
      }}
    >
      {meta.error ? <p className="font-semibold text-red-600 pb-1">{meta.error}</p> : undefined}
      {children}
    </div>}
  </>
};

/**
 * This should be used within a Formik component to submit it whenever values
 * change, rather than the form is submitted.
 */
export const SubmitOnChange = <T,>({ formik }: { formik: FormikProps<T> }): null => {
  const lastValues = useRef(formik.values);

  useEffect(() => {
    if (!isEqual(lastValues.current, formik.values) && formik.isValid) {
      lastValues.current = formik.values;
      void formik.submitForm();
    }
  }, [
    lastValues,
    formik.values,
    formik.initialValues,
    formik,
  ]);

  return null;
};

export const Checkbox: FunctionComponent<GenericFieldHTMLAttributes> = ({ children, ...props }) =>
  <label className="flex items-center space-x-3">
    <Field
      type="checkbox"
      className="checked:form-tick appearance-none h-6 w-6 border border-gray-300 rounded-md checked:bg-blue-600 checked:border-transparent focus:outline-none"
      {...props} />
    <span className="text-gray-900 font-medium">{children}</span>
  </label>;
