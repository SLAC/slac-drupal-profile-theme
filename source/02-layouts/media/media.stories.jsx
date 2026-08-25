import parse from 'html-react-parser';

import twigTemplate from './media.twig';
import data from './media.yml';

const settings = {
  title: 'Layouts/Media',
};

const Media = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
// export { Media };
