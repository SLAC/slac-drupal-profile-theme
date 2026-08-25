import parse from 'html-react-parser';

import twigTemplate from './grid.twig';
import data from './grid.yml';

const settings = {
  title: 'Layouts/Grid',
  argTypes: {
    is_demo: {
      table: {
        disable: true,
      },
    },
  },
};

const Default = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

const TwoColumn = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        num_of_cols: '2',
      })
    ),
  args: { ...data },
};

const ThreeColumn = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        num_of_cols: '3',
      })
    ),
  args: { ...data },
};

const FourColumn = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        num_of_cols: '4',
      })
    ),
  args: { ...data },
};

const SixColumn = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        num_of_cols: '6',
      })
    ),
  args: { ...data },
};

export default settings;
export { Default, TwoColumn, ThreeColumn, FourColumn, SixColumn };
