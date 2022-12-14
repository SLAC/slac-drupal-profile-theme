import parse from 'html-react-parser';

import ReactDOMServer from 'react-dom/server';
import React from 'react';
import twigTemplate from './page.twig';
import globalData from '../../00-config/storybook.global-data.yml';
import data from './page.yml';
import { WYSIWYG } from '../../03-components/wysiwyg/wysiwyg.stories.jsx';

const settings = {
  title: 'Templates/Page',
  parameters: {
    controls: {
      include: ['title', 'show_admin_info'],
    },
  },
};

const Page = args => parse(twigTemplate(args));
Page.args = {
  ...globalData,
  ...data,
  content: ReactDOMServer.renderToStaticMarkup(<>{WYSIWYG(WYSIWYG.args)}</>),
};

export default settings;
export { Page };
