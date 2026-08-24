import parse from 'html-react-parser';

import twigTemplate from './inline-form.twig';
import data from './inline-form.yml';

const settings = {
  title: 'Layouts/Inline Form',
  argTypes: {
    is_demo: {
      table: {
        disable: true,
      },
    },
  },
};

const InlineForm = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
// export { InlineForm };
