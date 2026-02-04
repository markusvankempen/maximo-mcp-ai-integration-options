import React from "react";
import PropTypes from "prop-types";
import {Button as CarbonButton} from 'carbon-components-react'

export default function Button(props) {
  return <CarbonButton onClick={props.onClick}>{props.label}</CarbonButton>
}

Button.propTypes = {
  onClick: PropTypes.func,
  label: PropTypes.string  
};
