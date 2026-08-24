import parse from 'html-react-parser';

import twigTemplate from './icon.twig';
import globalData from '../../00-config/storybook.global-data.yml';
import data from './icon.yml';

const settings = {
  title: 'Components/Icon',
};

const Icon = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...globalData, ...data },
};

export default settings;
export { Icon };
