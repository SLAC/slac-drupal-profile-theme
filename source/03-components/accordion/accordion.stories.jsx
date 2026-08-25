import parse from 'html-react-parser';
import ReactDOMServer from 'react-dom/server';
import React from 'react';

import globalData from '../../00-config/storybook.global-data.yml';
import accordionTemplate from './accordion.twig';
import accordionItemTemplate from './accordion-item.twig';
import data from './accordion.yml';
import './accordion.scss';
import './accordion.es6';
import {
  decorators,
  GridWrapper,
  sectionTypeArg,
  SectionWrapper,
  WysiwygWrapper,
} from '../../06-utility/storybookHelper';

const accordionData = data.accordions;

const settings = {
  title: 'Paragraphs/Accordion',
  parameters: {
    controls: {
      include: [
        'accordion_title',
        'title_tag',
        'accordions',
        'num_cols',
        'section_type',
      ],
    },
  },
  argTypes: {
    section_type: sectionTypeArg,
  },
  decorators,
};

const NarrowAccordion = {
  render: args =>
    parse(
      accordionTemplate({
        accordion_items: accordionData
          .map(item =>
            accordionItemTemplate({
              ...globalData,
              ...item,
              accordion_content: ReactDOMServer.renderToStaticMarkup(
                <WysiwygWrapper>
                  <div
                    dangerouslySetInnerHTML={{ __html: item.accordion_content }}
                  />
                </WysiwygWrapper>
              ),
            })
          )
          .join(''),
        ...args,
      })
    ),
  args: { ...globalData, ...data },
  argTypes: {
    num_cols: {
      control: 'select',
      options: [1, 2],
    },
  },
};

const WideAccordion = {
  render: args =>
    parse(
      accordionTemplate({
        accordion_items: accordionData
          .map(item =>
            accordionItemTemplate({
              ...globalData,
              ...item,
              accordion_content: ReactDOMServer.renderToStaticMarkup(
                <GridWrapper numCols={2}>
                  <SectionWrapper>
                    <WysiwygWrapper>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: item.accordion_content,
                        }}
                      />
                    </WysiwygWrapper>
                  </SectionWrapper>
                  <SectionWrapper>
                    <WysiwygWrapper>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: item.accordion_content,
                        }}
                      />
                    </WysiwygWrapper>
                  </SectionWrapper>
                </GridWrapper>
              ),
            })
          )
          .join(''),
        ...args,
      })
    ),
  args: {
    ...globalData,
    ...data,
    modifier_classes: 'c-accordion--large',
  },
  parameters: {
    controls: { exclude: ['num_cols'] },
  },
};

export default settings;
export { NarrowAccordion, WideAccordion };
