import parse from 'html-react-parser';

import twigTemplate from './citation.twig';
import data from './citation.yml';

const settings = {
  title: 'Components/Citation',
};

const Citation = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { Citation };
