import React from 'react';

import { storiesOf } from '@storybook/react';
import Widget from './Widget';
import BorderLayout from './BorderLayout'

storiesOf('BorderLayout', module)
  .add('default - top start', () => (
    <BorderLayout width={300} height={300}
                  top={<Widget color="red" width="100%">Top</Widget>}
                  bottom={<Widget color="blue" width="100%">Bottom</Widget>}
                  start={<Widget color="purple" width={50} height="100%" >Start</Widget>}
                  end={<Widget color="pink" width={50} height="100%">End</Widget>}
    >
      <Widget color="green" size="100%">Content</Widget>
    </BorderLayout>
  ))
  .add('header with content', () => (
    <BorderLayout width={300} height={300}
                  top={<Widget color="red" width="100%">Top</Widget>}
    >
      <Widget color="green" size="100%">Content</Widget>
    </BorderLayout>
  ))
  .add('header, start, with content', () => (
    <BorderLayout width={300} height={300}
                  top={<Widget color="red" width="100%">Top</Widget>}
                  start={<Widget color="blue" width={50} height="100%">Start</Widget>}
    >
      <Widget color="green" size="100%">Content</Widget>
    </BorderLayout>
  ))
;
