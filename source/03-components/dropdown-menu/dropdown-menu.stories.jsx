import parse from 'html-react-parser';

import twigTemplate from './dropdown-menu.twig';
import data from './dropdown-menu.yml';
import buttonData from './dropdown-menu-buttons.yml';
import './dropdown-menu.es6';
import './dropdown-menu.scss';
import '../mobile-menu/mobile-menu.scss';
import '../hamburger-button/hamburger-button.scss';

const settings = {
  title: 'Components/Menu/Dropdown Menu',
};

const DropdownMenu = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

const DropdownMenuWithButtons = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...buttonData },
};

export default settings;
export { DropdownMenu, DropdownMenuWithButtons };
