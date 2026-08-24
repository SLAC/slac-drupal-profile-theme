import parse from 'html-react-parser';
import React from 'react';

import twigTemplate from './article-hero.twig';
import data from './article-hero.yml';
import globalData from '../../00-config/storybook.global-data.yml';
import './article-hero.scss';
import { PageTitle } from '../page-title/page-title.stories';

const settings = {
  title: 'Components/Hero/Hero Without Overlay',
  parameters: {
    controls: {
      include: ['hero_image', 'hero_caption'],
    },
  },
};

const HeroWithoutOverlay = {
  render: args => (
    <>
      {parse(
        twigTemplate({
          ...args,
        })
      )}
      {}
      {args.showPageTitle && PageTitle.render(PageTitle.args)}
    </>
  ),
  args: { ...globalData, ...data, showPageTitle: true },
};

export default settings;
export { HeroWithoutOverlay };
