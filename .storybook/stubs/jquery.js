// `jquery` is a webpack external in .storybook/main.js (mapped to the `jQuery`
// global), so this stub must NOT `import ... from 'jquery'` — that request would
// be externalised back to `window.jQuery` and resolve to undefined. Import the
// real package by its dist path instead, then publish it as the global that the
// external expects. This mirrors how `stubs/once.js` vendors `@drupal/once`
// rather than importing the externalised `once` specifier.
import jQuery from 'jquery/dist/jquery.js';

window.jQuery = jQuery;
window.$ = jQuery;

export default jQuery;
