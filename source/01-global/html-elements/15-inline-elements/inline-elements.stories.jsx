import parse from 'html-react-parser';

import twigTemplate from './inline-elements.twig';

const settings = {
  title: 'Global/HTML Elements/Inline Elements',
  parameters: {
    controls: { hideNoControlsWarning: true },
  },
};

const InlineElements = {
  render: () => parse(twigTemplate()),
};

export default settings;
export { InlineElements };
