import parse from 'html-react-parser';

import twigTemplate from './space.twig';
import data from '../../00-config/config.design-tokens.yml';
import './space.scss';

const settings = {
  title: 'Global/Spacing',
  argTypes: {
    gesso: {
      table: {
        disable: true,
      },
    },
  },
};

const Spacing = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { Spacing };
