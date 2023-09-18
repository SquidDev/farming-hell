declare module "*.css" {
  const styles: Record<string, string>;
  export default styles;
}

declare module "*.json" {
  const path: string;
  export default path;
}

declare module "*.png" {
  const path: string;
  export default path;
}

// Needed for Formik
declare namespace React {
  type StatelessComponent<P> = React.FunctionComponent<P>;
}
