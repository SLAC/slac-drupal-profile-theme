import parse from 'html-react-parser';

import twigTemplate from './headings.twig';

const settings = {
  title: 'Global/HTML Elements/Headings',
  parameters: {
    controls: { hideNoControlsWarning: true },
  },
};

const Headings = {
  render: () => parse(twigTemplate()),
};

export default settings;
export { Headings };
