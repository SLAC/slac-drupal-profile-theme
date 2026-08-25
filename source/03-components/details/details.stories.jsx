import parse from 'html-react-parser';

import twigTemplate from './details.twig';
import data from './details.yml';

const settings = {
  title: 'Components/Details',
};

const Details = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
// export { Details };
