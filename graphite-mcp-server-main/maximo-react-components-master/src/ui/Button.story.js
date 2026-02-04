import React from 'react';
import Button from './Button';

import { storiesOf } from '@storybook/react';

storiesOf('Button', module)
    .add('Button', () => (
      <Button label="Test Button"/>
    ))
    .add('Button with onClick', () => (
        <Button label="Click Me" onClick={()=>{alert("worked")}}/>
    ))
;
