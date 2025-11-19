/* eslint-disable */
import Drupal from 'drupal';
import once from 'once';

/**
 * @file
 * Set up input elements for use in the filter modal.
 */
Drupal.behaviors.facetsInputWidget = {
  attach(context) {
    const facetInputs = once(
      'input-widget-setup',
      '.c-filter-modal-search__input',
      context
    );

    if (facetInputs.length > 0) {
      facetInputs.forEach(input => {
        // Prevent form submission on enter key press.
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
          }
        });
        // Clear keyword value on 'filter-modal:clear' event.
        input.addEventListener('filter-modal:clear', () => {
          if (input.value.length > 0) {
            input.value = '';
            input.setAttribute('value','');
          }
        });
      });
    }
  },
};
