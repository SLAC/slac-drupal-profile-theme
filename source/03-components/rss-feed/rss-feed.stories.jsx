import parse from 'html-react-parser';

import twigTemplate from './rss-feed.twig';
import globalData from '../../00-config/storybook.global-data.yml';
import data from './rss-feed.yml';

const settings = {
  title: 'Components/RSS Feed',
};

const RSSFeed = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...globalData, ...data },
};

export default settings;
export { RSSFeed };
