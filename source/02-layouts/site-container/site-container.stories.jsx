import parse from 'html-react-parser';

import twigTemplate from './site-container.twig';
import data from './site-container.yml';

const settings = {
  title: 'Layouts/Site Container',
  argTypes: {
    is_demo: {
      table: {
        disable: true,
      },
    },
  },
};

const SiteContainer = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
// export { SiteContainer };
