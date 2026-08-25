import parse from 'html-react-parser';
import ReactDOMServer from 'react-dom/server';
import React from 'react';

import twigTemplate from './views-view--accordion.twig';
import data from './views-view--accordion.yml';

import { FAQ } from '../../../04-templates/faq/faq.stories.jsx';
import { Default as Pager } from '../../pager/pager.stories.jsx';
import { FilterModal } from '../../filter-modal/filter-modal.stories.jsx';
import { SearchInPage } from '../../search/search.stories';

const settings = {
  title: 'Components/Views/Accordion View',
  parameters: {
    controls: {
      exclude: ['rows', 'pager', 'exposed'],
    },
  },
};

const AccordionView = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: {
    ...data,
    rows: [
      ReactDOMServer.renderToStaticMarkup(
        <>
          {FAQ.render(FAQ.args)}
          {FAQ.render({
            ...FAQ.args,
            title:
              'Where can I find the current requirements for masking on site?',
          })}
          {FAQ.render({
            ...FAQ.args,
            title: 'Can I travel for personal reasons?',
          })}
          {FAQ.render({
            ...FAQ.args,
            title:
              'Does SLAC Occupational Health or Security provide testing for visitors and conference attendees?',
          })}
          {FAQ.render({
            ...FAQ.args,
            title:
              'How will visitors and users be affected by the curtailment of on-site activity on SLAC?',
          })}
          {FAQ.render(FAQ.args)}
          {FAQ.render({
            ...FAQ.args,
            title:
              'Where can I find the current requirements for masking on site?',
          })}
          {FAQ.render({
            ...FAQ.args,
            title: 'Can I travel for personal reasons?',
          })}
          {FAQ.render({
            ...FAQ.args,
            title:
              'Does SLAC Occupational Health or Security provide testing for visitors and conference attendees?',
          })}
          {FAQ.render({
            ...FAQ.args,
            title:
              'How will visitors and users be affected by the curtailment of on-site activity on SLAC?',
          })}
          {FAQ.render(FAQ.args)}
          {FAQ.render({
            ...FAQ.args,
            title:
              'Where can I find the current requirements for masking on site?',
          })}
          {FAQ.render({
            ...FAQ.args,
            title: 'Can I travel for personal reasons?',
          })}
          {FAQ.render({
            ...FAQ.args,
            title:
              'Does SLAC Occupational Health or Security provide testing for visitors and conference attendees?',
          })}
          {FAQ.render({
            ...FAQ.args,
            title:
              'How will visitors and users be affected by the curtailment of on-site activity on SLAC?',
          })}
        </>
      ),
    ],
    pager: ReactDOMServer.renderToStaticMarkup(Pager.render(Pager.args)),
    exposed: ReactDOMServer.renderToStaticMarkup(
      <>
        {SearchInPage.render(SearchInPage.args)}
        {FilterModal.render(FilterModal.args)}
      </>
    ),
  },
};

export default settings;
export { AccordionView };
