import React from 'react';

import { storiesOf } from '@storybook/react';
import Widget from './Widget';
import Col from './Col'

storiesOf('Col', module)
  .add('default', () => (
    <Col >
      <Widget color={"red"}>A</Widget>
      <Widget color={"green"}>B</Widget>
      <Widget color={"blue"}>C</Widget>
    </Col>
  ))
  .add('align bottom', () => (
    <Col valignChildren={"bottom"} height={500} width={100} halignChildren={"center"} style={{border: '1px solid black'}}>
      <Widget color={"red"}>A</Widget>
      <Widget color={"green"}>B</Widget>
      <Widget color={"blue"}>C</Widget>
    </Col>
  ))
  .add('align center', () => (
    <Col valignChildren={"center"} height={500} width={100} halignChildren={"center"} style={{border: '1px solid black'}}>
      <Widget color={"red"}>A</Widget>
      <Widget color={"green"}>B</Widget>
      <Widget color={"blue"}>C</Widget>
    </Col>
  ))
;
