import type { FunctionComponent } from "react";

/**
 * Small helper-function for building class names.
 *
 * This is especially useful when some classes should be conditionally appled, as you can write:
 * {@code classNames(f(x) ? "some-class" : undefined)}
 */
export const classNames = (...classes: Array<string | undefined>): string => classes.filter(x => !!x).join(" ");

/** Wraps an <img> tag for a specific Atlas Academy icon, preconfiguring the correct width and height. */
export const Icon: FunctionComponent<{ className?: string, src: string, alt: string, title?: string }> = ({ className, src, alt, title }) =>
  <img className={className} alt={alt} src={src} title={title} width="128" height="128" />;


// I love Tailwind, but still haven't figured out the right way to do sane styling for links.
// Oh web dev, how I tire of you.
export const ExternalLink: FunctionComponent<{ href: string }> = ({ href, children }) =>
  <a href={href} target="_blank" className="font-bold text-blue-600 hover:text-blue-900 active:text-blue-900 focus:text-blue-900" rel="noreferrer">
    {children}
  </a>;


// I love Tailwind, but still haven't figured out the right way to do sane styling for links.
// Oh web dev, how I tire of you.
export const LinkButton: FunctionComponent<JSX.IntrinsicElements["button"]> = ({ children, ...props }) =>
  <button type="button" className="font-bold text-blue-600 hover:text-blue-900 active:text-blue-900 focus:text-blue-900" {...props}>
    {children}
  </button>;
