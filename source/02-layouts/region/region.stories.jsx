import parse from 'html-react-parser';

import twigTemplate from './region.twig';
import data from './region.yml';

const settings = {
  title: 'Layouts/Region',
  argTypes: {
    is_demo: {
      table: {
        disable: true,
      },
    },
  },
};

const Region = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
// export { Region };
