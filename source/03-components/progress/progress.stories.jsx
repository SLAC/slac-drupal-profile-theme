import parse from 'html-react-parser';

import twigTemplate from './progress.twig';
import data from './progress.yml';

const settings = {
  title: 'Components/Progress',
};

const Progress = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
// export { Progress };
