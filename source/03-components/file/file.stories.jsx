import parse from 'html-react-parser';

import twigTemplate from './file.twig';
import globalData from '../../00-config/storybook.global-data.yml';

const settings = {
  title: 'Components/File',
  parameters: {
    controls: {
      include: ['file', 'modifier_classes'],
    },
  },
};

const File = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...globalData },
};

export default settings;
export { File };
