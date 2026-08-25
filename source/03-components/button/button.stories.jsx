import parse from 'html-react-parser';

import twigTemplate from './button.twig';
import data from './button.yml';

const settings = {
  title: 'Components/Button',
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
        modifier_classes: 'c-button--secondary',
      })
    ),
  args: { ...data },
};

const Outline = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-button--outline',
      })
    ),
  args: { ...data },
};

const OutlineSecondary = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-button--outline-secondary',
      })
    ),
  args: { ...data },
};

const Base = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-button--base',
      })
    ),
  args: { ...data },
};

const Danger = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-button--danger',
      })
    ),
  args: { ...data },
};

const Small = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-button--small',
      })
    ),
  args: { ...data },
};

const Large = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        modifier_classes: 'c-button--large',
      })
    ),
  args: { ...data },
};

export default settings;
export {
  Primary,
  Secondary,
  Outline,
  OutlineSecondary,
  Base,
  Danger,
  Large,
  Small,
};
