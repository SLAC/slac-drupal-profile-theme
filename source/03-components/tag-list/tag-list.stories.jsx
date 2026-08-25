import parse from 'html-react-parser';

import twigTemplate from './tag-list.twig';
import data from './tag-list.yml';

const settings = {
  title: 'Components/Tag List',
};

const TagList = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { TagList };
