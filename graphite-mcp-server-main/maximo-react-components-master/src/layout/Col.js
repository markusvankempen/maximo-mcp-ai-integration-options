import React from "react";
import PropTypes from "prop-types";
import './Col.css';

export default function Col(props) {
  let style = {};
  let classes = ['col'];
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
    classes.push('col_ha_' + props.halignChildren);
  }

  if (props.valignChildren) {
    classes.push('col_va_' + props.valignChildren);
  }

  if (props.overflow) {
    classes.push('col_ov_' + props.overflow);
  }

  return (
    <div className={classes.join(' ')} style={Object.assign(style, props.style)}>
      {props.children}
    </div>
  );
}

Col.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  valignChildren: PropTypes.oneOf(['center', 'top', 'bottom', 'space-between']),
  halignChildren: PropTypes.oneOf(['center', 'start', 'end']),
  overflow: PropTypes.oneOf(['wrap', 'scroll', 'hidden'])
};
