import parse from 'html-react-parser';

import twigTemplate from './table.twig';

const settings = {
  title: 'Global/HTML Elements/Table',
  parameters: {
    controls: { hideNoControlsWarning: true },
  },
};

const Default = {
  render: () => parse(twigTemplate()),
};

export default settings;
export { Default };
