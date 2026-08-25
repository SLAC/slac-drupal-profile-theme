import parse from 'html-react-parser';

import twigTemplate from './button-group.twig';
import data from './button-group.yml';

const settings = {
  title: 'Components/ButtonGroup',
};

const Primary = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

const Secondary = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        button_modifier_classes: 'c-button--secondary',
      })
    ),
  args: { ...data },
};

const Base = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        button_modifier_classes: 'c-button--base',
      })
    ),
  args: { ...data },
};

const Danger = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        button_modifier_classes: 'c-button--danger',
      })
    ),
  args: { ...data },
};

const Small = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        button_modifier_classes: 'c-button--small',
      })
    ),
  args: { ...data },
};

const Large = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        button_modifier_classes: 'c-button--large',
      })
    ),
  args: { ...data },
};

export default settings;
export { Primary, Secondary, Base, Danger, Large, Small };
