import parse from 'html-react-parser';
import ReactDOMServer from 'react-dom/server';

import twigTemplate from './expandable-grid.twig';
import globalData from '../../00-config/storybook.global-data.yml';
import {
  sectionTypeArg,
  decorators,
} from '../../06-utility/storybookHelper.jsx';
import {
  Default as Card,
  News,
  Event as EventCard,
} from '../card/card.stories.jsx';

const settings = {
  title: 'Paragraphs/Cards With Show More',
  argTypes: {
    section_type: sectionTypeArg,
  },
  decorators,
  parameters: {
    controls: {
      include: ['section_type'],
    },
  },
};

const CardsWithShowMore = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: {
    ...globalData,
    grid_items: [
      ReactDOMServer.renderToStaticMarkup(Card.render(Card.args)),
      ReactDOMServer.renderToStaticMarkup(News.render(News.args)),
      ReactDOMServer.renderToStaticMarkup(EventCard.render(EventCard.args)),
      ReactDOMServer.renderToStaticMarkup(Card.render(Card.args)),
      ReactDOMServer.renderToStaticMarkup(News.render(News.args)),
      ReactDOMServer.renderToStaticMarkup(EventCard.render(EventCard.args)),
    ],
  },
};

export default settings;
export { CardsWithShowMore };
