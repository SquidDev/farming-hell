import { FunctionComponent, useCallback, useRef, useState } from "react";

import type { Store } from "../store";
import { read, write } from "../store/formats/webcrow";
import { DialogButton, DialogTitle } from "../support/dialog";
import { ExternalLink } from "../support/utils";

export const Export: FunctionComponent<{ store: Store, setOpen: (open: boolean) => void }> = ({ store, setOpen }) => <>
  <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900" >
    Export Servants to FGO Material Simulator
  </DialogTitle>
  <div className="flex flex-col gap-4">
    <textarea
      className="w-full h-32 p-2 border focus:ring-2 focus:ring-indigo-500 hover:ring-2 hover:ring-indigo-400 border-gray-300"
      value={write(store)}
    />
    <ul className="p-2 list-disc list-inside">
      <li>Copy the text from the box above</li>
      <li>Navigate to <ExternalLink href="http://fgosimulator.webcrow.jp/Material">fgosimulator.webcrow.jp</ExternalLink></li>
      <li>Click &ldquo;My Chaldea&rdquo; → &ldquo;引継ぎコード&rdquo; → &ldquo;サーヴァント&rdquo; → &ldquo;読込&rdquo;</li>
      <li>Paste into the box</li>
      <li>Click &ldquo;Load&rdquo;</li>
    </ul>
    <div className="flex justify-end gap-2">
      <DialogButton onClick={() => setOpen(false)}>Close</DialogButton>
    </div>
  </div>
</>;

export const Import: FunctionComponent<{ store: Store, setOpen: (open: boolean) => void }> = ({ store, setOpen }) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onLoadClick = useCallback(() => {
    try {
      read(store, ref.current?.value ?? "");
    } catch (e) {
      setError(`${e}`); // eslint-disable-line @typescript-eslint/restrict-template-expressions
      return;
    }

    setError(null);
    setOpen(false);
  }, [store, ref, setOpen, setError]);

  return <>
    <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900" >
      Import from FGO Material Simulator
    </DialogTitle>
    <div className="flex flex-col gap-4">
      <ul className="p-2 list-disc list-inside">
        <li>Navigate to <ExternalLink href="http://fgosimulator.webcrow.jp/Material">fgosimulator.webcrow.jp</ExternalLink></li>
        <li>Click &ldquo;My Chaldea&rdquo; → &ldquo;引継ぎコード&rdquo; → &ldquo;サーヴァント&rdquo; → &ldquo;発行&rdquo;</li>
        <li>Copy the text and paste into the box below</li>
        <li>Click &ldquo;Load&rdquo;</li>
      </ul>
      {store.ownedServants.length > 0 &&
        <div className="p-2 bg-yellow-300 text-yellow-900 border border-yellow-600 rounded-sm">
          <strong>Warning:</strong> This will overwrite any existing servants.
        </div>}
      {error &&
        <div className="p-2 bg-red-300 text-red-900 border border-red-600 rounded-sm">
          <strong>Error loading data:</strong> {error}
        </div>}
      <textarea
        ref={ref}
        className="w-full h-32 p-2 border focus:ring-2 focus:ring-indigo-500 hover:ring-2 hover:ring-indigo-400 border-gray-300"
      />
      <div className="flex justify-end gap-2">
        <DialogButton onClick={() => setOpen(false)}>Close</DialogButton>
        <DialogButton
          onClick={onLoadClick}
          className="text-green-900 bg-green-200 hover:bg-green-300 focus-visible:ring-green-500"
        >
          Load
        </DialogButton>
      </div>
    </div>
  </>;
};
