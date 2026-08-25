import parse from 'html-react-parser';

import twigTemplate from './message.twig';
import data from './message.yml';

const settings = {
  title: 'Components/Message',
};

const Default = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

const ErrorMessage = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        type: 'error',
      })
    ),
  args: { ...data },
};

const WarningMessage = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        type: 'warning',
      })
    ),
  args: { ...data },
};

export default settings;
export { Default, ErrorMessage, WarningMessage };
