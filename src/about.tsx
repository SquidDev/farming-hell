import type { FunctionComponent } from "react";

import { DialogTitle } from "./support/dialog";
import { ExternalLink } from "./support/utils";
import emptyImg from "../doc/help-empty.png";
import spishtarImg from "../doc/help-spishtar.png";

export const About: FunctionComponent = () => <>
  <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900">
    About
  </DialogTitle>
  <div className="space-y-3">
    <p>
      <em>Farming Hell</em> is a servant planner and manager for Fate/Grand Order.
    </p>
    <p>
      The source is <ExternalLink href="https://github.com/SquidDev/farming-hell/">available on GitHub</ExternalLink>.
      Please report any issues there.
    </p>
    <p>
      All data is sourced from the <ExternalLink href="https://atlasacademy.io/">Atlas Academy&apos;s data dumps</ExternalLink>.
      This is licensed under the <ExternalLink href="https://opendatacommons.org/licenses/by/1-0/">Open Data Commons
        Attribution License (ODC-BY 1.0)</ExternalLink>.
    </p>
    <p>
      Farming Hell also uses code from many fantastic open source projects. See <ExternalLink href="/licenses.txt">licenses.txt</ExternalLink>
      {" "}for more information.
    </p>
  </div>
</>;

export const Instructions: FunctionComponent = () => <>
  <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900">
    Instructions
  </DialogTitle>
  <div className="space-y-3">
    <p>
      Welcome to Farming Hell, a servant planner and resource manager for Fate/Grand Order.
    </p>
    <p>
      First click the big &ldquo;plus&rdquo; button in the middle of the screen. You should see a new servant appear - Artoria Pendragon.
    </p>

    <img src={emptyImg} alt="An empty servant input" className="m-auto max-w-[395px] w-full" />

    <p>
      You can then change the servant using the first dropdown, and then input the servant&apos;s level, ascension and skills.
      Each input box is split into two - the level your servant is currently at and the target level you&apos;d like them to
      reach.
    </p>

    <p>
      For instance, imagine I&apos;ve rolled Space Ishtar (oh, imagine!). I&apos;m planning to max her, but due to resource
      limitations, only have her at level 73 and 1/1/10. I&apos;d set her up like this:
    </p>

    <img src={spishtarImg} alt="Space Ishtar configured at 1/1/10" className="m-auto max-w-[395px] w-full" />

    <p>
      Once you&apos;ve added a few servants, you probably want to see the total number of materials you need to gather. Head
      to the &ldquo;Materials&rdquo; tab by clicking the button on the left. This shows all the resources you&apos;ll need. You can also
      enter the number of resources you have right now, and track your farming progress.
    </p>
    <p>
      Clicking on a specific item (not QP or Embers) will show you which servants need that item, as well as upcoming
      events featuring this item and the best farming locations.
    </p>
  </div>
</>;
