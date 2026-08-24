import parse from 'html-react-parser';

import './embed.es6';
import twigTemplate from './embed.twig';
import data from './embed.yml';
import { decorators, sectionTypeArg } from '../../06-utility/storybookHelper';

const settings = {
  title: 'Paragraphs/Embed',
  argTypes: {
    width: {
      options: ['content', 'wide', 'full'],
      control: {
        type: 'select',
      },
    },
    section_type: sectionTypeArg,
  },
  decorators,
};

const Embed = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

const EmbedWide = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-embed--wide',
      })
    ),
  args: { ...data },
};

const EmbedFull = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-embed--full',
      })
    ),
  args: { ...data },
};

export default settings;
export { Embed, EmbedWide, EmbedFull };
