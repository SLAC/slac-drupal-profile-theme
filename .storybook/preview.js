import Twig from 'twig';
import { useEffect } from '@storybook/preview-api';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import twigDrupal from '@forumone/twig-drupal-filters';
import twigAttributes from '../lib/addAttributesTwigExtension';
import keysort from '../lib/keysort';
import uniqueId from '../lib/uniqueId';
import fieldValue from '../lib/fieldValue';
import twigCreateAttributes from '../lib/createAttributeTwigExtension';
import './stubs/drupal';
import './stubs/once';

import '../dist/css/styles.css';

function setupTwig(twig) {
  twig.cache();
  twigDrupal(twig);
  twigAttributes(twig);
  keysort(twig);
  uniqueId(twig);
  twigCreateAttributes(twig);
  fieldValue(twig);
  return twig;
}

setupTwig(Twig);

export const decorators = [
  storyFn => {
    useEffect(() => Drupal.attachBehaviors(), []);
    return storyFn();
  },
];

const preview = {
  parameters: {
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
      viewports: INITIAL_VIEWPORTS,
    },
  },
};
export default preview;
