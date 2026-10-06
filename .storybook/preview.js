import Twig from 'twig';
import { useEffect } from 'storybook/preview-api';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';
import twigDrupal from '@forumone/twig-drupal-filters';
import twigAttributes from '../lib/addAttributesTwigExtension';
import keysort from '../lib/keysort';
import uniqueId from '../lib/uniqueId';
import fieldValue from '../lib/fieldValue';
import twigCreateAttributes from '../lib/createAttributeTwigExtension';
import assetVersion from '../lib/assetVersion';
import './stubs/drupal';
import './stubs/once';

import '../dist/css/styles.css';
// Site-wide behaviors from the slac/global library. The component-specific
// scripts in that library (header, search, embed) are imported by their stories.
import '../source/03-components/arrow-link/arrow-link.es6';
import '../source/03-components/external-link/external-link.es6';
import '../source/06-utility/transitions.es6';

function setupTwig(twig) {
  twig.cache();
  twigDrupal(twig);
  twigAttributes(twig);
  keysort(twig);
  uniqueId(twig);
  twigCreateAttributes(twig);
  fieldValue(twig);
  assetVersion(twig);
  return twig;
}

setupTwig(Twig);

export const decorators = [
  storyFn => {
    useEffect(() => window.Drupal.attachBehaviors(), []);
    return storyFn();
  },
];

const preview = {
  parameters: {
    controls: {
      disableSaveFromUI: true,
    },
    layout: 'fullscreen',
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Global',
          ['Color Palette', '*'],
          'Layouts',
          'Components',
          'Paragraphs',
          'Templates',
          'Pages',
        ],
        includeName: true,
      },
    },
    viewport: {
      options: INITIAL_VIEWPORTS,
    },
  },
};
export default preview;
