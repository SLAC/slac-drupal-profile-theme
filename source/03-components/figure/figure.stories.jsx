import parse from 'html-react-parser';
import React from 'react';

import twigTemplate from './figure.twig';
import data from './figure.yml';
import videoData from './figure--iframe.yml';
import globalData from '../../00-config/storybook.global-data.yml';
import mediaLightboxTemplate from '../media-lightbox/media-lightbox.twig';
import videoLightboxData from '../media-lightbox/video-lightbox.yml';
import imageLightboxData from '../media-lightbox/image-lightbox.yml';
import {
  decorators,
  sectionTypeArg,
} from '../../06-utility/storybookHelper.jsx';

const settings = {
  title: 'Paragraphs/Figure',
  parameters: {
    controls: {
      include: ['media', 'caption', 'section_type', 'num_cols'],
    },
  },
  argTypes: {
    section_type: sectionTypeArg,
  },
  decorators,
};

const Default = {
  render: args => (
    <>
      {parse(
        twigTemplate({
          ...args,
        })
      )}
      {parse(
        mediaLightboxTemplate({
          ...globalData,
          ...imageLightboxData,

          media_embed: args.media_embed || imageLightboxData.media_embed,

          lightbox_id: args.lightbox_id || imageLightboxData.lightbox_id,
        })
      )}
    </>
  ),
  args: {
    ...data,
    caption: '',
    lightbox_id: 'image-lightbox',
    num_cols: 4,
  },
};

const FigureCentered = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'u-align-center',
      })
    ),
  args: { ...data },
  argTypes: {
    num_cols: {
      control: 'select',
      options: [1, 2, 3, 4],
    },
  },
};

const FigureCenteredWide = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'u-align-center u-align-wide',
      })
    ),
  args: { ...data },
  argTypes: {
    ...FigureCentered.argTypes,
  },
};

const FigureRight = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'u-align-right',
      })
    ),
  args: {
    ...data,
    media:
      '<img src="https://picsum.photos/300?image=237" alt="dog photo" loading="lazy" width="300" height="300">',
  },
};

const FigureLeft = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'u-align-left',
      })
    ),
  args: {
    ...data,
    media:
      '<img src="https://picsum.photos/300?image=237" alt="dog photo" loading="lazy" width="300" height="300">',
  },
};

const FigureWithVideo = {
  render: args => (
    <>
      {parse(
        twigTemplate({
          ...args,
        })
      )}
      {parse(
        mediaLightboxTemplate({
          ...globalData,
          ...videoLightboxData,

          lightbox_id: args.lightbox_id || videoLightboxData.lightbox_id,
        })
      )}
    </>
  ),
  args: {
    ...videoData,
    ...globalData,
    caption: '',
    num_cols: 4,
  },
};

const FigureWithVideoCentered = {
  render: args => (
    <>
      {parse(
        twigTemplate({
          ...args,
          modifier_classes: 'u-align-center',
        })
      )}
      {parse(mediaLightboxTemplate({ ...globalData, ...videoLightboxData }))}
    </>
  ),
  args: { ...videoData, ...globalData },
  argTypes: {
    num_cols: {
      control: 'select',
      options: [1, 2, 3, 4],
    },
  },
};

export default settings;
export {
  Default,
  FigureCentered,
  FigureCenteredWide,
  FigureRight,
  FigureLeft,
  FigureWithVideo,
  FigureWithVideoCentered,
};
