import React from 'react';

import PageWrapper from './page-wrappers/default.jsx';
import { EventDetail as PageTemplate } from '../04-templates/event-detail/event-detail.stories.jsx';
import { Header } from '../02-layouts/header/header.stories.jsx';

export default {
  title: 'Pages/Event Detail Page',
  parameters: {
    controls: {
      include: [
        'show_admin_info',
        'hideInternalHeader',
        'site_name',
        'has_logo',
        'header_freeform',
      ],
    },
  },
};

const EventDetailPage = {
  render: ({ show_admin_info, ...args }) => (
    <PageWrapper {...args}>
      {PageTemplate.render(PageTemplate.args)}
    </PageWrapper>
  ),
  args: {
    ...Header.args,
    hideInternalHeader: false,
  },
};
export { EventDetailPage };
