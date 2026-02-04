import React from 'react';

import { storiesOf } from '@storybook/react';
import Widget from './Widget';
import Section from './Section'

storiesOf('Section', module)
  .add('header, footer, and content', () => (
    <Section width={300} height={300} style={{border: '1px dotted blue'}} header={<Widget color="red" width="100%">A</Widget>} footer={<Widget color="blue" width="100%">C</Widget>}>
      <Widget color="green" size="100%">B</Widget>
    </Section>
  ))
;
