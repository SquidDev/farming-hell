import { Field, FieldAttributes, FormikProps, GenericFieldHTMLAttributes, useField } from "formik";
import Tooltip from "rc-tooltip";
import "rc-tooltip/assets/bootstrap.css";
import { FunctionComponent, ReactNode, forwardRef, useEffect, useRef } from "react";
import isEqual from "react-fast-compare";

import { classNames } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RefField: FunctionComponent<FieldAttributes<any>> = forwardRef(function RefField(props, ref) {
  return <Field innerRef={ref} {...props} />;
});

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

  return <Tooltip
    trigger='focus'
    overlay={() => <>
      {meta.error ? <p className="font-semibold text-red-600 pb-1">{meta.error}</p> : undefined}
      {children}
    </>}
    placement='bottom'
    // @ts-ignore: Types for Tooltip are incomplete.
    blurDelay={0}
  >
    <RefField
      name={name}
      className={classNames(
        "border focus:ring-2 focus:ring-indigo-500 hover:ring-2 hover:ring-indigo-400",
        classes,
        meta.error ? "border-red-600" : "border-gray-300"
      )} {...props} />
  </Tooltip>;
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
