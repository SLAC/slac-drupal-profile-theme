import Drupal from 'drupal';
import once from 'once';
import drupalSettings from 'drupalSettings';
import SearchFlyout from './modules/SearchFlyout.es6';
import YurtsHelpers from './modules/YurtsHelpers.es6';

Drupal.behaviors.search = {
  attach(context) {
    let yurtsInitialized = false;
    const search = once('search-dropdown-init', '.c-search--dropdown', context);
    search.forEach(searchElem => {
      const searchFlyout = new SearchFlyout(searchElem);
      searchFlyout.init();
    });
    const searchForms = context.querySelectorAll('.c-search__form');
    searchForms.forEach(searchForm => {
      const searchInput = searchForm.querySelector('.c-search__input');
      const searchInputSlacWeb = searchForm.querySelector('.c-search__slac-web');
      const searchSubmit = searchForm.querySelector('.c-search__submit');
      const searchRadios = searchForm.querySelectorAll(
        'input[name="search_type"]'
      );
      const searchHidden = searchForm.querySelector('.c-search__hidden');
      function handleRadioChange() {
        const selectedSearch = this.value;
        let searchUrl = `${drupalSettings.maskedPath || ''}/search`;
        let searchInputName = 'keywords';
        searchHidden.innerHTML = '';
        if (selectedSearch === 'people') {
          searchUrl =
            'https://phonebook.slac.stanford.edu/dirsearch.aspx';
          searchInputName = 'NAME';
          searchHidden.insertAdjacentHTML(
            'beforeend',
            `<input type="hidden" name="lf" value="1" /><input type="hidden" name="url" value="" /><input type="hidden" name="gone" value="active" />`
          );
        }
        if (selectedSearch === 'slac_web') {
          const yurtsDiv = searchForm.querySelector('[data-yurts-div]');
          if(!yurtsInitialized) {
            yurtsInitialized = new YurtsHelpers(yurtsDiv);
          }
          searchInput.hidden = true;
          searchSubmit.hidden = true;
          searchInputSlacWeb.hidden = false;
          searchForm.classList.add('c-search__form--web-search');
        }
        else {
          searchInput.hidden = false;
          searchSubmit.hidden = false;
          searchInputSlacWeb.hidden = true;
          searchForm.classList.remove('c-search__form--web-search');
        }
        searchInput.setAttribute('name', searchInputName);
        searchForm.setAttribute('action', searchUrl);
      }
      if (searchRadios.length) {
        searchRadios.forEach(radio => {
          radio.addEventListener('change', handleRadioChange);
        });
        searchRadios[0].dispatchEvent(new InputEvent('change'));
        searchRadios[0].checked = true;
      }
    });
  },
};
