import parse from 'html-react-parser';

import twigTemplate from './promo-box.twig';
import data from './promo-box.yml';
import { SectionWithPaddingWrapper } from '../../06-utility/storybookHelper.jsx';

const settings = {
  title: 'Paragraphs/Promo Box',
  decorators: [
    Story => (
      <SectionWithPaddingWrapper>
        <Story />
      </SectionWithPaddingWrapper>
    ),
  ],
};

const PromoBox = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

const Small = {
  render: args => parse(twigTemplate({ ...args })),
  args: {
    ...data,
    modifier_classes: 'c-promo-box--small',
    promo_box_content: `<a href="https://example.com">Upcoming Events</a>
<a href="#0">Machine Status</a>
<a href="#0">Fact Sheets</a>`,
  },
};

export default settings;
export { PromoBox, Small };
