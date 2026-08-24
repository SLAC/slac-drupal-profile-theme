import parse from 'html-react-parser';

import twigTemplate from './feedback-form.twig';
import data from './feedback-form.yml';

const settings = {
  title: 'Components/Feedback Form',
};

const FeedbackForm = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

export default settings;
// export { FeedbackForm };
