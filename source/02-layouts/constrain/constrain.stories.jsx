import parse from 'html-react-parser';
import twigTemplate from './constrain.twig';

const settings = {
  title: 'Layouts/Constrain',
  argTypes: {
    is_demo: {
      table: {
        disable: true,
      },
    },
  },
};

const Default = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { is_demo: true },
};

const Small = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { is_demo: true, modifier_classes: 'l-constrain--small' },
};

const Large = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { is_demo: true, modifier_classes: 'l-constrain--large' },
};

export default settings;
export { Default, Small, Large };
