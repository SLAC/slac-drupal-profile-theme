import parse from 'html-react-parser';

import twigTemplate from './cta-link.twig';
import data from './cta-link.yml';

const settings = {
  title: 'Components/CTA Link',
};

const CtaLink = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { CtaLink };
