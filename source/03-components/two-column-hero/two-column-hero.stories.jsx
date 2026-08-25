import parse from 'html-react-parser';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import twigTemplate from './two-column-hero.twig';
import data from './two-column-hero.yml';
import { PageTitle } from '../page-title/page-title.stories.jsx';
import { LargeCard, LargeEventCard } from '../card/card.stories.jsx';
import { HeroWithoutOverlay } from '../article-hero/article-hero.stories.jsx';

const settings = {
  title: 'Components/Hero/Two-Column Hero',
};

const WithFeaturedContent = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: {
    ...data,
    page_title: ReactDOMServer.renderToStaticMarkup(
      PageTitle.render({
        ...PageTitle.args,
        byline: false,
        kicker: false,
        has_constrain: false,
      })
    ),
    featured_content: ReactDOMServer.renderToStaticMarkup(
      LargeEventCard.render(LargeEventCard.args)
    ),
  },
};

const WithoutFeaturedContent = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: {
    ...data,
    page_title: ReactDOMServer.renderToStaticMarkup(
      PageTitle.render({
        ...PageTitle.args,
        byline: false,
        kicker: false,
        has_constrain: false,
      })
    ),
  },
};

const WithImage = {
  render: args => (
    <>
      {HeroWithoutOverlay.render({
        ...HeroWithoutOverlay.args,
        showPageTitle: false,
      })}
      {parse(
        twigTemplate({
          ...args,
        })
      )}
    </>
  ),
  args: {
    ...data,
    page_title: ReactDOMServer.renderToStaticMarkup(
      PageTitle.render({
        ...PageTitle.args,
        byline: false,
        kicker: false,
        has_constrain: false,
      })
    ),
    featured_content: ReactDOMServer.renderToStaticMarkup(
      LargeCard.render(LargeCard.args)
    ),
  },
};

export default settings;
export { WithFeaturedContent, WithoutFeaturedContent, WithImage };
