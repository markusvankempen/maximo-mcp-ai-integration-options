import React from "react";
import PropTypes from "prop-types";
import './Row.css';

export default function Row(props) {
  let style = {};
  let classes = ['row'];
  if (props.className) classes.push(props.className);

  if (props.height) {
    if (typeof(props.height) === 'number')
      style.height = props.height + 'px';
    else
      style.height = props.height;
  }

  if (props.width) {
    if (typeof(props.width) === 'number')
      style.width = props.width + 'px';
    else
      style.width = props.width;
  }

  if (props.halignChildren) {
    classes.push('row_ha_' + props.halignChildren);
  }

  if (props.valignChildren) {
    classes.push('row_va_' + props.valignChildren);
  }

  if (props.overflow) {
    classes.push('row_ov_' + props.overflow);
  }

  return (
    <div className={classes.join(' ')} style={Object.assign(style, props.style)}>
      {props.children}
    </div>
  );
}

Row.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  valignChildren: PropTypes.oneOf(['center', 'top', 'bottom']),
  halignChildren: PropTypes.oneOf(['center', 'start', 'end', 'space-between']),
  overflow: PropTypes.oneOf(['wrap', 'scroll', 'hidden'])
};
