import parse from 'html-react-parser';

import twigTemplate from './paragraph.twig';

const settings = {
  title: 'Global/HTML Elements/Paragraph',
  parameters: {
    controls: { hideNoControlsWarning: true },
  },
};

const Paragraph = {
  render: () => parse(twigTemplate()),
};

export default settings;
export { Paragraph };
