import React from 'react';
import renderer from 'react-test-renderer';
import Col from './Col';

describe('<Col/>', () => {
  it('renders without crashing', () => {
    let col = renderer.create(
      <Col>
        <div>A</div>
      </Col>
    );
    let tree = col.toJSON();
    expect(tree).toMatchSnapshot();

    col = renderer.create(
      <Col valignChildren='center'>
        <div>A</div>
      </Col>
    );
    tree = col.toJSON();
    expect(tree).toMatchSnapshot();
  });
})
