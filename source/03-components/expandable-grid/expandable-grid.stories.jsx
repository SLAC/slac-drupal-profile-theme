import parse from 'html-react-parser';

import twigTemplate from './expandable-grid.twig';
import data from './expandable-grid.yml';
import globalData from '../../00-config/storybook.global-data.yml';

const settings = {
  title: 'Components/Expandable Grid',
};

const ExpandableGrid = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...globalData, ...data },
};

export default settings;
export { ExpandableGrid };
