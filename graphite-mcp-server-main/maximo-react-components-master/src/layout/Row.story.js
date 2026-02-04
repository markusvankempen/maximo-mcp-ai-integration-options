import React from 'react';

import { storiesOf } from '@storybook/react';
import Row from './Row';
import Widget from './Widget';

storiesOf('Row', module)
  .add('default - top start', () => (
    <Row >
      <Widget color={"red"}>A</Widget>
      <Widget color={"green"}>B</Widget>
      <Widget color={"blue"}>C</Widget>
    </Row>
  ))
  .add('space between', () => (
    <Row halignChildren="space-between">
      <Widget color={"red"}>A</Widget>
      <Widget color={"green"}>B</Widget>
      <Widget color={"blue"}>C</Widget>
    </Row>
  ))
  .add('centered horizontally', () => (
    <Row halignChildren="center">
      <Widget color={"red"}>A</Widget>
      <Widget color={"green"}>B</Widget>
      <Widget color={"blue"}>C</Widget>
    </Row>
  ))
  .add('centered vertically', () => (
    <Row valignChildren="center" style={{border: '1px dotted grey'}} height={500}>
      <Widget color={"red"}>A</Widget>
      <Widget color={"green"}>B</Widget>
      <Widget color={"blue"}>C</Widget>
    </Row>
  ))
  .add('centered both', () => (
    <Row halignChildren="center" valignChildren="center"  height={500} style={{border: '1px dotted grey'}}>
      <Widget color={"red"}>A</Widget>
      <Widget color={"green"}>B</Widget>
      <Widget color={"blue"}>C</Widget>
    </Row>
  ))
  .add('Aligned to bottom', () => (
    <Row valignChildren="bottom"  height={500} style={{border: '1px dotted grey'}}>
      <Widget color={"red"}>A</Widget>
      <Widget color={"green"}>B</Widget>
      <Widget color={"blue"}>C</Widget>
    </Row>
  ))
  .add('Aligned to end', () => (
    <Row halignChildren="end"  height={500}>
      <Widget color={"red"}>A</Widget>
      <Widget color={"green"}>B</Widget>
      <Widget color={"blue"}>C</Widget>
    </Row>
  ))
  .add('Aligned to end (RTL)', () => (
    <div dir="RTL">
      <Row halignChildren="end"  height={500}>
        <Widget color={"red"}>A</Widget>
        <Widget color={"green"}>B</Widget>
        <Widget color={"blue"}>C</Widget>
      </Row>
    </div>
  ))
;
