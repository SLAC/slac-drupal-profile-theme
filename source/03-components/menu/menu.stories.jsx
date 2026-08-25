import parse from 'html-react-parser';

import twigTemplate from './menu.twig';
import data from './menu.yml';

const settings = {
  title: 'Components/Menu/Default',
};

const Default = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { Default };
