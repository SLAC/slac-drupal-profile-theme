import parse from 'html-react-parser';

import twigTemplate from './site-name.twig';
import globalData from '../../00-config/storybook.global-data.yml';

const settings = {
  title: 'Components/Site Name',
  argTypes: {
    url: {
      type: 'string',
      description: 'The URL of the site homepage',
      table: {
        defaultValue: {
          summary: '#',
        },
      },
    },
    site_name: {
      type: 'string',
      description: 'The site name or title',
      table: {
        defaultValue: {
          summary: 'Site Title',
        },
      },
    },
    has_logo: {
      type: 'boolean',
      table: {
        defaultValue: {
          summary: true,
        },
      },
    },
  },
  parameters: {
    controls: {
      include: ['site_name', 'url', 'has_logo'],
    },
    docs: {
      description: {
        component: 'The site title, displayed prominently in the header.',
      },
    },
  },
};

const SiteName = args =>
  parse(
    twigTemplate({
      ...args,
    })
  );
SiteName.args = { ...globalData, has_logo: true };

export default settings;
export { SiteName };
