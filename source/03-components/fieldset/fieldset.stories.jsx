import parse from 'html-react-parser';

import twigTemplate from './fieldset.twig';
import data from './fieldset.yml';

const settings = {
  title: 'Components/Fieldset',
};

const Fieldset = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { Fieldset };
