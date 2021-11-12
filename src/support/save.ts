/**
 * Save a Blob to a file
 *
 * @param filename The name of the file to save.
 * @param blob The blob we're trying to save.
 */
export default (filename: string, blob: Blob): void => {
  // Somewhat inspired by https://github.com/eligrey/FileSaver.js/blob/master/src/FileSaver.js
  // Goodness knows how well this works on non-modern browsers.
  const element = document.createElement("a") ;
  const url = URL.createObjectURL(blob);

  element.download = filename;
  element.rel = "noopener";
  element.href = url;

  setTimeout(() => URL.revokeObjectURL(url), 60e3);
  setTimeout(() => {
    try {
      element.dispatchEvent(new MouseEvent("click"));
    } catch (e) {
      const mouseEvent = document.createEvent("MouseEvents");
      mouseEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
      element.dispatchEvent(mouseEvent);
    }
  }, 0);
};
