import parse from 'html-react-parser';

import twigTemplate from './map.twig';
import data from './map.yml';

const settings = {
  title: 'Components/Map',
};

const Map = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { Map };
