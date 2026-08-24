import parse from 'html-react-parser';

import twigTemplate from './menu--subfooter.twig';
import data from './menu--subfooter.yml';

const settings = {
  title: 'Components/Menu/Subfooter Menu',
};

const SubfooterMenu = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { SubfooterMenu };
