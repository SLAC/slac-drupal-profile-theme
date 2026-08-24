import parse from 'html-react-parser';

import twigTemplate from './card.twig';

import data from './card.yml';
import largeCardData from './card-large.yml';
import eventCardData from './card-event.yml';
import multidayEventCardData from './card-multiday-event.yml';
import virtualEventCardData from './card-virtual-event.yml';
import newsCardData from './card-news.yml';
// import eventFallbackCardData from './card-event-fallback.yml';
import largeEventCardData from './card-event-large.yml';
import bioCardData from './card-bio.yml';
import globalData from '../../00-config/storybook.global-data.yml';
import { decorators, sectionTypeArg } from '../../06-utility/storybookHelper';

const settings = {
  title: 'Paragraphs/Card',
  parameters: {
    controls: {
      include: [
        'title',
        'url',
        'kicker',
        'card_content',
        'is_truncated',
        'link_type',
        'link_text',
        'link_url',
        'section_type',
        'num_cols',
      ],
    },
  },
  argTypes: {
    section_type: sectionTypeArg,
  },
  decorators,
};

const Default = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...globalData, ...data, num_cols: 3 },
  argTypes: {
    num_cols: {
      control: 'select',
      options: [1, 2, 3, 4],
    },
  },
};

const CardWithIcon = {
  render: args => parse(twigTemplate(args)),
  args: {
    ...Default.args,
    media: false,
    icon: '<img src="https://picsum.photos/id/1015/100/100" alt="">',
    link_type: 'cta',
    link_text: 'Big CTA Link',
  },
  argTypes: {
    ...Default.argTypes,
  },
};

const CardNoImage = {
  render: args => parse(twigTemplate(args)),
  args: { ...Default.args, media: false, icon: false },
  argTypes: {
    ...Default.argTypes,
  },
};

const LargeCard = {
  render: args =>
    parse(twigTemplate({ ...args, modifier_classes: 'c-card--large' })),
  args: { ...globalData, ...largeCardData, num_cols: 2 },
};

const News = {
  render: args => parse(twigTemplate(args)),
  args: { ...globalData, ...newsCardData, num_cols: 3 },
  argTypes: {
    num_cols: {
      control: 'select',
      options: [2, 3],
    },
  },
};

const NewsTeaser = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-card--teaser',
      })
    ),
  args: {
    ...globalData,
    ...newsCardData,
    kicker: 'News article teaser',
  },
};

const Teaser = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-card--teaser',
      })
    ),
  args: { ...globalData, ...data },
};

// const VideoCard = args =>
//   parse(
//     twigTemplate({
//       ...args,
//       is_video: true,
//       type: 'Video',
//       footer: 'Jun 2, 2020 · 1:08:48 runtime',
//     })
//   );
// VideoCard.args = { ...globalData, ...data };

const Event = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...globalData, ...eventCardData, num_cols: 3 },
  argTypes: {
    num_cols: {
      control: 'select',
      options: [2, 3],
    },
  },
};

const EventMultiday = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...globalData, ...multidayEventCardData, num_cols: 3 },
  argTypes: {
    ...Event.argTypes,
  },
};

const EventVirtual = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...globalData, ...virtualEventCardData, num_cols: 3 },
  argTypes: {
    ...Event.argTypes,
  },
};

const EventTeaser = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-card--teaser',
        event_date: 'Thursday, April 20, 2022 · 1:00 - 3:00 p.m. PT',
      })
    ),
  args: { ...globalData, ...virtualEventCardData },
};

// const EventFallbackCard = args =>
//   parse(
//     twigTemplate({
//       ...args,
//     })
//   );
// EventFallbackCard.args = { ...globalData, ...eventFallbackCardData };

const LargeEventCard = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...globalData, ...largeEventCardData, num_cols: 2 },
  parameters: {
    controls: {
      include: [
        'title',
        'url',
        'kicker',
        'card_content',
        'link_type',
        'link_text',
        'link_url',
        'section_type',
        'start_date',
        'event_date',
        'event_location',
        'is_virtual',
      ],
    },
  },
};

// const ExtraLargeCardWithLeftText = args =>
//   parse(
//     twigTemplate({
//       ...args,
//     })
//   );
// ExtraLargeCardWithLeftText.args = {
//   ...ExtraLargeCardWithRightText.args,
//   alignment: 'left',
// };

const BioCard = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...globalData, ...bioCardData, num_cols: 3 },
  argTypes: {
    num_cols: {
      control: 'select',
      options: [2, 3],
    },
  },
};

const BioCardWithFallback = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: {
    ...BioCard.args,
    media: false,
  },
  argTypes: {
    ...BioCard.argTypes,
  },
};

const BioTeaser = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-card--teaser',
      })
    ),
  args: {
    ...BioCard.args,
    num_cols: 1,
  },
};

export default settings;
export {
  Default,
  CardWithIcon,
  CardNoImage,
  LargeCard,
  Teaser,
  News,
  NewsTeaser,
  Event,
  EventMultiday,
  EventVirtual,
  // EventFallbackCard,
  // LargeCard,
  // VideoCard,
  LargeEventCard,
  EventTeaser,
  BioCard,
  BioCardWithFallback,
  BioTeaser,
};
