import React from 'react';
import ReactDOMServer from 'react-dom/server';

import globalData from '../00-config/storybook.global-data.yml';
import PageWrapper from './page-wrappers/default.jsx';
import { HeroWithoutButton } from '../03-components/hero-bg-image/hero-bg-image.stories.jsx';
import { Header } from '../02-layouts/header/header.stories.jsx';
import {
  GridWrapper,
  SectionWithPaddingWrapper,
  WysiwygWrapper,
} from '../06-utility/storybookHelper.jsx';
import {
  Section,
  SectionWithBlueGreenGradient,
  SectionWithGrayWhiteGradient,
  SectionWithYellowBackground,
} from '../02-layouts/section/section.stories.jsx';
import { LargeEventCard, News } from '../03-components/card/card.stories.jsx';
import { PromoBox } from '../03-components/promo-box/promo-box.stories.jsx';
import { SmallCard } from '../03-components/card/card--small/card--small.stories.jsx';
import { EventList } from '../03-components/event-list/event-list.stories.jsx';

export default {
  title: 'Pages/Homepage',
  parameters: {
    controls: {
      include: [
        'show_admin_info',
        'hideInternalHeader',
        'site_name',
        'has_logo',
        'header_freeform',
      ],
    },
  },
};

const Homepage = {
  render: args => (
    <PageWrapper {...args}>
      {HeroWithoutButton.render(HeroWithoutButton.args)}
      <SectionWithPaddingWrapper>
        <WysiwygWrapper>
          <h2>
            Title that grabs attention and accurately describes a topic lorem
            ipsum dolor sit amet magna
          </h2>
          <p className="c-lede">
            Description teaser is informative, intriguing, and compelling to
            your target audiences. Keep it friendly and approachable with a
            brief well-written overview of your business and services. Tell just
            enough of your story, make it enticing that the reader begs for
            more.
          </p>
          <p>
            <a href="#0" className="c-button c-button--chevron">
              Button Lorem Ipsum
            </a>
            <a href="#0" className="c-button c-button--chevron">
              Button Lorem
            </a>
          </p>
        </WysiwygWrapper>
      </SectionWithPaddingWrapper>
      {SectionWithGrayWhiteGradient.render({
        ...SectionWithGrayWhiteGradient.args,
        section_title: 'Title to Lorem Ipsum',
        section_intro: false,
        section_buttons: false,
      })}
      {SectionWithBlueGreenGradient.render({
        ...SectionWithBlueGreenGradient.args,
        section_kicker: 'Recent News',
        section_title: 'Department News',
        section_title_url: false,
        section_intro: false,
        section_content: ReactDOMServer.renderToStaticMarkup(
          <GridWrapper numCols={3}>
            {News.render(News.args)}
            {News.render(News.args)}
            {News.render(News.args)}
          </GridWrapper>
        ),
        section_buttons:
          '<a href="#0" class="c-button c-button--secondary c-button--chevron">View All News</a>',
      })}
      {PromoBox.render(PromoBox.args)}
      {Section.render({
        ...Section.args,
        section_kicker: 'Upcoming Events',
        section_title: "What's Happening",
        section_title_url: false,
        section_intro: false,
        section_buttons:
          '<a href="#0" class="c-button c-button--chevron">View all Events</a>',
        section_content: ReactDOMServer.renderToStaticMarkup(
          <GridWrapper numCols={2}>
            {EventList.render(EventList.args)}
            {LargeEventCard.render(LargeEventCard.args)}
          </GridWrapper>
        ),
      })}
      {SectionWithYellowBackground.render({
        ...SectionWithYellowBackground.args,
        section_kicker: 'Kicker Lorem Ipsum',
        section_intro: false,
        section_content: ReactDOMServer.renderToStaticMarkup(
          <GridWrapper numCols={4}>
            {SmallCard.render(SmallCard.args)}
            {SmallCard.render(SmallCard.args)}
            {SmallCard.render(SmallCard.args)}
            {SmallCard.render(SmallCard.args)}
          </GridWrapper>
        ),
        section_buttons: false,
      })}
    </PageWrapper>
  ),
  args: {
    ...globalData,
    ...Header.args,
    hideInternalHeader: false,
    bodyClasses: 'homepage',
    hideBreadcrumbs: true,
    hideSocialLinks: true,
  },
};

export { Homepage };
