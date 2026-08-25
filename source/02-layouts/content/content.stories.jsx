import parse from 'html-react-parser';

import twigTemplate from './content.twig';
import data from './content.yml';

const settings = {
  title: 'Layouts/Content',
  argTypes: {
    is_demo: {
      table: {
        disable: true,
      },
    },
  },
};

const Content = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
// export { Content };
