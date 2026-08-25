import parse from 'html-react-parser';

import twigTemplate from './search-result.twig';
import data from './search-result.yml';

const settings = {
  title: 'Components/Search Result',
};

const SearchResult = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { SearchResult };
