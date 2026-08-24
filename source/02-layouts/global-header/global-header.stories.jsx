import parse from 'html-react-parser';
import twigTemplate from './global-header.twig';
import data from './global-header.yml';

const settings = {
  title: 'Layouts/Global Header',
  argTypes: {
    is_demo: {
      table: {
        disable: true,
      },
    },
  },
};

const GlobalHeader = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

const GlobalHeaderHomepage = {
  render: args => (
    <div className="homepage" style={{ backgroundColor: '#016895' }}>
      {parse(
        twigTemplate({
          ...args,
        })
      )}
    </div>
  ),
  args: { ...data },
};

export default settings;
export { GlobalHeader, GlobalHeaderHomepage };
