import type { Store } from "../store";
import saveBlob from "../support/save";

export type Reader = (store: Store, contents: string) => void;
export type Writer = (store: Store) => string;

const loadFromBlob = (store: Store, reader: Reader, blob: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      try {
        reader(store, fileReader.result as string);
      } catch (e) {
        reject(`Failed to read file (${e})`); // eslint-disable-line @typescript-eslint/restrict-template-expressions
        return;
      }

      resolve();
    });
    fileReader.addEventListener("error", () => reject("Failed to read file"));
    fileReader.readAsText(blob);
  });
};

export const loadFromFile = (store: Store, reader: Reader, type: string): void => {
  const fileInput: HTMLInputElement = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = type;
  fileInput.addEventListener("input", () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    loadFromBlob(store, reader, file).catch(e => console.error(e));
  });
  fileInput.click();
};

export const storeToFile = (store: Store, writer: Writer, name: string, type: string): void => {
  saveBlob(name, new Blob([writer(store)], { type }));
};
