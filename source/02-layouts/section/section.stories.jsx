import parse from 'html-react-parser';

import ReactDOMServer from 'react-dom/server';
import React from 'react';
import twigTemplate from './section.twig';
import gridTemplate from '../grid/grid.twig';
import globalData from '../../00-config/storybook.global-data.yml';
import data from './section.yml';
import { Default as Card } from '../../03-components/card/card.stories.jsx';
import { WYSIWYG } from '../../03-components/wysiwyg/wysiwyg.stories.jsx';

const settings = {
  title: 'Layouts/Section',
  argTypes: {
    is_demo: {
      table: {
        disable: true,
      },
    },
  },
};

const SectionContent = gridTemplate({
  grid_content: ReactDOMServer.renderToStaticMarkup(
    <>
      {Card.render(Card.args)}
      {Card.render(Card.args)}
      {Card.render(Card.args)}
      {Card.render(Card.args)}
      {Card.render(Card.args)}
      {Card.render(Card.args)}
    </>
  ),
  num_of_cols: 3,
});

const Template = args =>
  parse(
    twigTemplate({
      section_content: SectionContent,
      ...args,
    })
  );

const Section = {
  render: Template,
  args: { ...data, modifier_classes: 'l-section--white' },
};

const SectionWithPurpleBlackGradient = {
  render: Template,
  args: {
    ...data,
    modifier_classes: 'l-section--dark l-section--purple-black',
    section_buttons: `
    <a href="#0" class="c-button c-button--secondary">Button 1</a>
    <a href="#1" class="c-button c-button--secondary">Button 2</a>
  `,
  },
};

const SectionWithBlueGreenGradient = {
  render: Template,
  args: {
    ...data,
    modifier_classes: 'l-section--dark l-section--blue-green',
    section_buttons: `
    <a href="#0" class="c-button c-button--secondary">Button 1</a>
    <a href="#1" class="c-button c-button--secondary">Button 2</a>
  `,
  },
};

const SectionWithYellowBackground = {
  render: Template,
  args: {
    ...data,
    modifier_classes: 'l-section--yellow',
  },
};

const SectionWithGrayBackground = {
  render: Template,
  args: {
    ...data,
    modifier_classes: 'l-section--gray',
  },
};

const SectionWithPurpleBackground = {
  render: Template,
  args: {
    ...data,
    modifier_classes: 'l-section--dark l-section--purple',
    section_buttons: `
    <a href="#0" class="c-button c-button--secondary">Button 1</a>
    <a href="#1" class="c-button c-button--secondary">Button 2</a>
  `,
  },
};

const SectionWithBlueBackground = {
  render: Template,
  args: {
    ...data,
    modifier_classes: 'l-section--dark l-section--blue',
    section_buttons: `
    <a href="#0" class="c-button c-button--secondary">Button 1</a>
    <a href="#1" class="c-button c-button--secondary">Button 2</a>
  `,
  },
};

const SectionWithGrayWhiteGradient = {
  render: Template,
  args: {
    ...data,
    modifier_classes: 'l-section--gray-white',
  },
};

const SectionWithWhiteGrayGradient = {
  render: Template,
  args: {
    ...data,
    modifier_classes: 'l-section--white-gray',
  },
};

const SectionWithRSS = {
  render: Template,
  args: {
    ...globalData,
    ...data,
    modifier_classes: 'l-section--white l-section--rss',
    is_rss: true,
  },
};

const ledeContent = `
  <h1>Title</h1>
  <div class="c-lede">
      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur rem minus a eligendi consequatur veniam beatae recusandae amet dolor optio. Debitis cupiditate quas aspernatur maiores ipsam explicabo sed dolorem voluptatem.</p>
  </div>
`;

const wysiwygContent = `<h2>Title</h2>
  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur rem minus a eligendi consequatur veniam beatae recusandae amet dolor optio. Debitis cupiditate quas aspernatur maiores ipsam explicabo sed dolorem voluptatem.</p>`;

const SectionTwoOneContent = gridTemplate({
  grid_content: ReactDOMServer.renderToStaticMarkup(
    <>
      {WYSIWYG.render({ content: ledeContent })}
      {WYSIWYG.render({ content: wysiwygContent })}
      {WYSIWYG.render({ content: wysiwygContent })}
    </>
  ),
  num_of_cols: 4,
});

const TwoOneTemplate = args =>
  parse(
    twigTemplate({
      section_content: SectionTwoOneContent,
      ...args,
    })
  );

const SectionTwoToOne = {
  render: TwoOneTemplate,
  args: {
    ...data,
    modifier_classes: 'l-section--two-one',
    section_buttons: false,
    section_intro: false,
    section_title: false,
    section_kicker: false,
  },
};

export default settings;
export {
  Section,
  SectionWithPurpleBlackGradient,
  SectionWithBlueGreenGradient,
  SectionWithGrayBackground,
  SectionWithYellowBackground,
  SectionWithPurpleBackground,
  SectionWithBlueBackground,
  SectionWithGrayWhiteGradient,
  SectionWithWhiteGrayGradient,
  SectionWithRSS,
  SectionTwoToOne,
};
