import Drupal from 'drupal';
import once from 'once';
import drupalSettings from 'drupalSettings';
import SearchFlyout from './modules/SearchFlyout.es6';

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
      function initYurtsSearch(yurtsDiv) {
        if (yurtsDiv) {
          yurtsDiv.id = 'YurtsSearch';
          // eslint-disable-next-line no-undef
          Yurts().searchWidget({
            settings: {
              assistantId: '2734019e-9bfe-4f14-8150-5e9c34aef57c',
              NEXT_PUBLIC_API: 'https://api-yurts.slac.stanford.edu/',
              NEXT_PUBLIC_APPLICATION_URL: 'https://yurts.slac.stanford.edu',
              AUTH_URL: 'https://auth-yurts.slac.stanford.edu/realms/yurts',
              CLIENT_ID: 'yurtswidgets',
              theme: 'light'
            },
          });
          yurtsInitialized = true;
        }
      }
      function handleRadioChange() {
        const selectedSearch = this.value;
        let searchUrl = `${drupalSettings.maskedPath || ''}/search`;
        let searchInputName = 'keywords';
        searchHidden.innerHTML = '';
        if (selectedSearch === 'people') {
          searchUrl =
            'https://www-public.slac.stanford.edu/phonebook/dirsearch.aspx';
          searchInputName = 'NAME';
          searchHidden.insertAdjacentHTML(
            'beforeend',
            `<input type="hidden" name="lf" value="1" /><input type="hidden" name="url" value="" /><input type="hidden" name="gone" value="active" />`
          );
        }
        if (selectedSearch === 'slac_web') {
          if(!yurtsInitialized) {
            const yurtsDiv = this.closest('.c-search__form').querySelector('[data-yurts-div]');
            initYurtsSearch(yurtsDiv);
          }
          searchInput.style.display = 'none';
          searchSubmit.style.display = 'none';
          searchInputSlacWeb.style.display = 'block';
          searchForm.classList.add('c-search__form--web-search');
        }
        else {
          searchInput.style.display = 'block';
          searchSubmit.style.display = 'block';
          searchInputSlacWeb.style.display = 'none';
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
