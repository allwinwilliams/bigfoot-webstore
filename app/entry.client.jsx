// import {RemixBrowser} from '@remix-run/react';
// import {startTransition, StrictMode} from 'react';
// import {hydrateRoot} from 'react-dom/client';


// startTransition(() => {
//   hydrateRoot(
//     document,
//     <StrictMode>
//       <RemixBrowser />
//     </StrictMode>,
//   );
// });


import React from 'react';
import { RemixBrowser } from '@remix-run/react';
import {startTransition, StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './lib/theme';

const hydrate = () => {
  startTransition(() => {
    hydrateRoot(
      document.getElementsByTagName('body')[0],
      <ThemeProvider theme={theme}>
        {/* <StrictMode> */}
          <CssBaseline />
          <RemixBrowser />
        {/* </StrictMode> */}
      </ThemeProvider> 
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  setTimeout(hydrate, 1);
}