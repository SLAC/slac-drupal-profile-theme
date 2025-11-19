import Drupal from 'drupal';

Drupal.behaviors.filterModal = {
  attach(context) {
    const modalOuter = context.querySelector('.c-filter-modal');
    const modalInner = context.querySelector('.c-filter-modal__inner');
    const modalClose = context.querySelector('.c-filter-modal__close');
    const modalApply = context.querySelector('.c-filter-modal__apply');
    const modalClear = context.querySelector('.c-filter-modal__clear');

    if (!modalOuter || !modalInner || !modalClose) {
      return;
    }

    if (modalClear) {
      modalClear.addEventListener('click', () => {
        const fields = modalInner.querySelectorAll('select, input');

        fields.forEach(field => {
          field.dispatchEvent(new CustomEvent('filter-modal:clear'));
        });
      });
    }

    if (modalApply) {
      modalApply.addEventListener('click', () => {
        const currentUrl = new URL(window.location.href);
        const urlParams = new URLSearchParams(currentUrl.search);
        const inputs = modalInner.querySelectorAll('input');
        const inputNames = Array.from(inputs).map(input => input.name);
        const paramFilters = [
          'f[',
          'page',
          ...inputNames,
        ]
        // Clear out the existing facet, input and pagination parameters
        const filteredParams = Array.from(urlParams.entries()).filter(
          param => !paramFilters.some(paramFilter => param[0].indexOf(paramFilter) === 0)
        );
        // Add params for populated inputs.

        const inputParams = [];
        inputs.forEach(inputField => {
          const { value } = inputField;
          if (value) {
            inputParams.push([inputField.name, value]);
          }
        });
        // Add params for currently selected facets.
        const dropdowns = modalInner.querySelectorAll('select');
        const f = [];
        dropdowns.forEach(dropdownFilter => {
          const { value } = dropdownFilter;
          if (value) {
            f.push(value);
          }
        });
        const newParams = new URLSearchParams([
          ...filteredParams,
          ...f.map((v, i) => [`f[${i}]`, v]),
          ...inputParams,
        ]).toString();
        const redirectUrl = new URL(
          `${currentUrl.origin}${currentUrl.pathname}?${newParams}${currentUrl.hash}`
        );
        modalClose.click();
        window.location.href = redirectUrl.href;
      });
    }
  },
};
