import React from "react";
import PropTypes from "prop-types";
import './Row.css';

/**
 * A Widget is a simple artifact for testing.  It has no UI value, except to render a box so that it can be visualized within a layout container.
 *
 * @param props
 * @returns {*}
 * @constructor
 */
export default function Widget(props) {
  let size = '';
  if (props.size) {
    if (typeof props.size === 'string' ) {
      size = props.size;
    } else {
      size = props.size + 'px';
    }
  }

  let width='';
  if (props.width) {
    if (typeof props.width === 'string') {
      width=props.width;
    } else {
      width=props.width+'px';
    }
  }

  let height='';
  if (props.height) {
    if (typeof props.height === 'string') {
      height=props.height;
    } else {
      height=props.height+'px';
    }
  }

  let style = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    border: (props.border || '1px solid black'),
    backgroundColor: props.color || 'white',
    color: 'black',
    height: (height) || (size) || '50px',
    minHeight: (height) || (size) || '50px',
    width: (width) || (size) || '50px',
    minWidth: (width) || (size) || '50px',
  };

  return (
    <div style={Object.assign(style, props.style)}>
      {props.children}
    </div>
  );
}

Widget.propTypes = {
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color: PropTypes.string,
  border: PropTypes.string,
};
