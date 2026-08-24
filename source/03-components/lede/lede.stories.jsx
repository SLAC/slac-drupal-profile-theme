import parse from 'html-react-parser';

import twigTemplate from './lede.twig';
import data from './lede.yml';

const settings = {
  title: 'Components/Lede',
};

const Lede = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { Lede };
