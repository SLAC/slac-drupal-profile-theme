import parse from 'html-react-parser';

import twigTemplate from './menu--account.twig';
import data from './menu--account.yml';

const settings = {
  title: 'Components/Menu/Account Menu',
};

const AccountMenu = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { AccountMenu };
