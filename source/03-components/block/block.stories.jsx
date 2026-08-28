import parse from 'html-react-parser';

import twigTemplate from './block.twig';
import data from './block.yml';

const settings = {
  title: 'Components/Block',
};

const Block = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { Block };
