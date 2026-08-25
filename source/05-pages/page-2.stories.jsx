import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { Page as PageTemplate } from '../04-templates/page/page.stories.jsx';
import { SideMenu } from '../03-components/menu/menu--side/menu--side.stories.jsx';
import PageWrapper from './page-wrappers/default.jsx';
import { HeroWithoutButton } from '../03-components/hero-bg-image/hero-bg-image.stories.jsx';
import {
  SectionWithGrayWhiteGradient,
  SectionWithYellowBackground,
} from '../02-layouts/section/section.stories.jsx';
import { Default as Card } from '../03-components/card/card.stories.jsx';
import {
  GridWrapper,
  SectionWithPaddingWrapper,
  SectionWrapper,
  WysiwygWrapper,
} from '../06-utility/storybookHelper.jsx';
import { FigureWithVideoCentered } from '../03-components/figure/figure.stories.jsx';
import { FiftyFifty } from '../03-components/fifty-fifty/fifty-fifty.stories.jsx';
import { Quote } from '../03-components/quote/quote.stories.jsx';
import { OverlapImage } from '../03-components/overlap-image/overlap-image.stories.jsx';
import { MediaGrid } from '../03-components/media-grid/media-grid.stories.jsx';
import { SmallCardWithIcon } from '../03-components/card/card--small/card--small.stories.jsx';
import { PromoBox } from '../03-components/promo-box/promo-box.stories.jsx';
import { VerticalLinkCard } from '../03-components/card/card--link/card--link.stories.jsx';
import { Header } from '../02-layouts/header/header.stories';

export default {
  title: 'Pages/Basic Page/Basic Page 2',
  parameters: {
    controls: {
      include: [
        'show_admin_info',
        'has_sidebar',
        'hideInternalHeader',
        'site_name',
        'has_logo',
        'header_freeform',
      ],
    },
  },
};

const BasicPage2 = {
  render: ({ has_sidebar, sidebar, is_demo, ...args }) => (
    <PageWrapper
      hero={HeroWithoutButton.render(HeroWithoutButton.args)}
      {...args}
    >
      {PageTemplate.render({
        ...args,
        title: 'Basic Page Example',
        lede: 'Description teaser is informative, intriguing, and compelling to your target audiences. Keep it friendly and approachable with a brief well-written overview of your business and services. Tell just enough of your story, make it enticing that the reader begs for more.',
        author_name: false,
        has_title_constrain: !has_sidebar,
        content: ReactDOMServer.renderToStaticMarkup(
          <>
            {SectionWithGrayWhiteGradient.render({
              ...SectionWithGrayWhiteGradient.args,
              section_title: 'Title that grabs attention',
              section_buttons: false,
            })}
            {SectionWithGrayWhiteGradient.render({
              ...SectionWithGrayWhiteGradient.args,
              section_content: ReactDOMServer.renderToStaticMarkup(
                Card.render(Card.args)
              ),
              section_buttons: false,
            })}
            {SectionWithGrayWhiteGradient.render({
              ...SectionWithGrayWhiteGradient.args,
              section_buttons: false,
              section_content: ReactDOMServer.renderToStaticMarkup(
                <GridWrapper numCols={2}>
                  <SectionWrapper>{Card.render(Card.args)}</SectionWrapper>
                  <SectionWrapper>{Card.render(Card.args)}</SectionWrapper>
                  <SectionWrapper>{Card.render(Card.args)}</SectionWrapper>
                  <SectionWrapper>{Card.render(Card.args)}</SectionWrapper>
                </GridWrapper>
              ),
            })}
            <SectionWithPaddingWrapper>
              <WysiwygWrapper>
                <>
                  <hr />
                  <h3>How to Bend a Stream of Dark Matter and Make it Shine</h3>
                  <p>
                    The nature of dark matter is one of the most captivating and
                    fundamental open problems facing physicists today. Over many
                    decades, we have collected overwhelming evidence for the
                    existence of dark matter in the universe.
                  </p>
                </>
              </WysiwygWrapper>
              {FigureWithVideoCentered.render(FigureWithVideoCentered.args)}
            </SectionWithPaddingWrapper>
            {SectionWithGrayWhiteGradient.render({
              ...SectionWithGrayWhiteGradient.args,
              section_buttons: false,
              section_title: false,
              section_intro: false,
              section_kicker: false,
              section_content: ReactDOMServer.renderToStaticMarkup(
                <>
                  {FiftyFifty.render({
                    col_1: ReactDOMServer.renderToStaticMarkup(
                      FigureWithVideoCentered.render(
                        FigureWithVideoCentered.args
                      )
                    ),
                    col_2: ReactDOMServer.renderToStaticMarkup(
                      Quote.render(Quote.args)
                    ),
                  })}
                  {Quote.render(Quote.args)}
                </>
              ),
            })}
            <SectionWithPaddingWrapper>
              {OverlapImage.render(OverlapImage.args)}
            </SectionWithPaddingWrapper>
            <SectionWithPaddingWrapper>
              {OverlapImage.render({
                ...OverlapImage.args,
                position: 'bottom-right',
              })}
            </SectionWithPaddingWrapper>
            <SectionWithPaddingWrapper>
              <WysiwygWrapper>
                <hr />
                <h2>Lorem Ipsum Image Gallery Grid</h2>
                <p>
                  Description text image gallery. We are hoping that a
                  30-maximum image gallery or media gallery can have both images
                  and video. Description text image gallery. We are hoping that
                  a 30-maximum image gallery or media gallery can have both
                  images and video.{' '}
                </p>
              </WysiwygWrapper>
              {MediaGrid.render(MediaGrid.args)}
            </SectionWithPaddingWrapper>
            {SectionWithYellowBackground.render({
              ...SectionWithYellowBackground.args,
              section_kicker: 'Kicker Lorem Ipsum',
              section_intro: false,
              section_buttons: false,
              section_content: ReactDOMServer.renderToStaticMarkup(
                <GridWrapper numCols={4}>
                  {SmallCardWithIcon.render(SmallCardWithIcon.args)}
                  {SmallCardWithIcon.render(SmallCardWithIcon.args)}
                  {SmallCardWithIcon.render(SmallCardWithIcon.args)}
                  {SmallCardWithIcon.render(SmallCardWithIcon.args)}
                </GridWrapper>
              ),
            })}
            <SectionWithPaddingWrapper>
              {PromoBox.render(PromoBox.args)}
            </SectionWithPaddingWrapper>
            {SectionWithGrayWhiteGradient.render({
              ...SectionWithGrayWhiteGradient.args,
              section_kicker: 'Quick Links',
              section_title: 'Resources',
              section_intro: false,
              section_buttons: false,
              section_content: ReactDOMServer.renderToStaticMarkup(
                <GridWrapper numCols={3}>
                  {VerticalLinkCard.render(VerticalLinkCard.args)}
                  {VerticalLinkCard.render(VerticalLinkCard.args)}
                  {VerticalLinkCard.render(VerticalLinkCard.args)}
                  {VerticalLinkCard.render(VerticalLinkCard.args)}
                  {VerticalLinkCard.render(VerticalLinkCard.args)}
                  {VerticalLinkCard.render(VerticalLinkCard.args)}
                </GridWrapper>
              ),
            })}
          </>
        ),
        has_sidebar,
        sidebar,
      })}
    </PageWrapper>
  ),
  args: {
    ...PageTemplate.args,
    ...Header.args,
    hideInternalHeader: false,
    has_sidebar: false,
    sidebar: ReactDOMServer.renderToStaticMarkup(
      SideMenu.render(SideMenu.args)
    ),
  },
};

export { BasicPage2 };
