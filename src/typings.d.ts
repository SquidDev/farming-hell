declare module "*.css" {
  const styles: { [className: string]: string };
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