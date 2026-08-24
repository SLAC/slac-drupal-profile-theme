import parse from 'html-react-parser';

import twigTemplate from './section-search.twig';
import data from './section-search.yml';

const settings = {
  title: 'Components/Section Search',
};

const SectionSearch = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { SectionSearch };
