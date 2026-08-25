import parse from 'html-react-parser';

import twigTemplate from './kicker.twig';
import data from './kicker.yml';

const settings = {
  title: 'Components/Kicker',
};

const Kicker = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

const BigKicker = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data, modifier_classes: 'c-kicker--big' },
};

export default settings;
export { Kicker, BigKicker };
