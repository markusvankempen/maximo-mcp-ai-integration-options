import React from "react";
import PropTypes from "prop-types";

import Col from './Col'
import Row from './Row'

export default function Section(props) {
  let style = {};
  let classes = ['section'];
  if (props.className) classes.push(props.className);
  return (
    (props.layout==='row') ?
    <Row className={classes.join(' ')} {...props} style={Object.assign(style, props.style)}>
      {props.header?props.header:null}
      <div style={{flex: '1 1', height: '100%'}}>{props.children}</div>
      {props.footer?props.footer:null}
    </Row>
      :
      <Col className={classes.join(' ')} {...props} style={Object.assign(style, props.style)}>
        {props.header?props.header:null}
        <div style={{flex: '1 1', width: '100%'}}>{props.children}</div>
        {props.footer?props.footer:null}
      </Col>
  );
}

Section.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  header: PropTypes.element,
  footer: PropTypes.element,
  layout: PropTypes.oneOf(['row', 'col'])
};
