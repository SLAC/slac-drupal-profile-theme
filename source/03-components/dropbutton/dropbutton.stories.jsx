import parse from 'html-react-parser';

import './dropbutton.es6';
import './dropbutton.scss';
import data from './dropbutton.yml';
import twigTemplate from './dropbutton.twig';

export default {};
const settings = {
  title: 'Components/Dropbutton',
};

const Dropbutton = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: {
    ...data,
  },
};
