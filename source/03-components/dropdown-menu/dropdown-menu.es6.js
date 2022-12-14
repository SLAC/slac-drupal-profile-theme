import Drupal from 'drupal';
import once from 'once';
import MobileMenu from '../mobile-menu/modules/_MobileMenu.es6';
import MenuBar from './modules/_MenuBar.es6';

Drupal.behaviors.dropdownMenu = {
  attach(context, settings) {
    const menuNodes = once('dropdown-menu-init', '.c-dropdown-menu', context);
    if (menuNodes.length) {
      menuNodes.forEach(menuNode => {
        const dropdownMenu = new MenuBar(menuNode);
        dropdownMenu.init();
        const mobileMenu = new MobileMenu(menuNode, context, {
          classPrefix: 'c-dropdown-menu',
          utilityNavClass: '.l-internal-header',
          searchBlockClass: '.c-search .c-search__form',
          otherBlockClass: '.l-header__freeform',
          imagePath: settings.gesso.gessoImagePath,
          logoClass: '.l-global-header__logo',
        });
        mobileMenu.init();
        if (Drupal.behaviors.search) {
          Drupal.behaviors.search.attach(mobileMenu.overlay);
        }
      });
    }
  },
};
