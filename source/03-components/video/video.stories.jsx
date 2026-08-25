import parse from 'html-react-parser';

import twigTemplate from './video.twig';
import data from './video.yml';
import localData from './video--local.yml';

const settings = {
  title: 'Components/Video',
};

const RemoteVideo = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...data },
};

const LocalVideo = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
      })
    ),
  args: { ...localData },
};

export default settings;
// export { RemoteVideo, LocalVideo };
