import parse from 'html-react-parser';

import twigTemplate from './list.twig';
import data from './list.yml';

const settings = {
  title: 'Components/List',
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

const Border = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-list--border',
      })
    ),
  args: { ...data },
};

const Clean = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-list--clean',
      })
    ),
  args: { ...data },
};

const Column = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-list--column',
      })
    ),
  args: { ...data },
};

const Inline = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-list--inline',
      })
    ),
  args: { ...data },
};

const Pipeline = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-list--pipeline',
      })
    ),
  args: { ...data },
};

export default settings;
export { Default, Border, Clean, Column, Inline, Pipeline };
