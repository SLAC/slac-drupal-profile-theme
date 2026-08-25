import parse from 'html-react-parser';

import twigTemplate from './menu--side.twig';
import data from './menu--side.yml';
import './menu--side.scss';

const settings = {
  title: 'Components/Menu/Side Menu',
};

const SideMenu = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { SideMenu };
