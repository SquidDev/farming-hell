/**
 * Inject WDYR into the app. This should be included at the very top of index.tsx
 * when needed (i.e. debugging rendering performance).
 */

import React from "react";
import whyDidYouRender from "@welldone-software/why-did-you-render";

if (process.env.NODE_ENV === "development") {
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    logOnDifferentValues: true,
    hotReloadBufferMs: 0,
  });
}
