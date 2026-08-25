import parse from 'html-react-parser';

import twigTemplate from './small-paragraph.twig';
import data from './small-paragraph.yml';

const settings = {
  title: 'Components/Small Paragraph',
};

const SmallParagraph = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
export { SmallParagraph };
