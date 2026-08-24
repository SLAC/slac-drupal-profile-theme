import parse from 'html-react-parser';

import twigTemplate from './wide-card.twig';
import data from './wide-card.yml';
import { sectionTypeArg, decorators } from '../../06-utility/storybookHelper';

const settings = {
  title: 'Paragraphs/Wide Card',
  argTypes: {
    section_type: sectionTypeArg,
  },
  decorators,
};

const WideCard = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { WideCard };
