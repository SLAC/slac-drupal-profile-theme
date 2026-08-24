import parse from 'html-react-parser';

import twigTemplate from './field.twig';
import data from './field.yml';
import listTwigTemplate from './field--list/field--list.twig';
import listData from './field--list/field--list.yml';

export default {};
const settings = {
  title: 'Components/Field',
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

const List = {
  render: args =>
    parse(
      listTwigTemplate({
        ...args,
      })
    ),
  args: { ...listData },
};

const Tight = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-field--tight',
      })
    ),
  args: { ...data },
};
