import React from 'react';
import renderer from 'react-test-renderer';
import Row from './Row';

it('renders without crashing', () => {
  let row = renderer.create(
    <Row>
      <div>A</div>
    </Row>
  );
  let tree = row.toJSON();
  expect(tree).toMatchSnapshot();

  row = renderer.create(
    <Row valignChildren='center'>
      <div>A</div>
    </Row>
  );
  tree = row.toJSON();
  expect(tree).toMatchSnapshot();
});
