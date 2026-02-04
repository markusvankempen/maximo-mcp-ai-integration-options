import React from "react";
import PropTypes from "prop-types";

import Section from "./Section";

/**
 * BorderLayout is a component that is responsible for rendering a layout with all 4 edges and a dynamic sized content in the middle
 * @param props
 * @returns {*}
 * @constructor
 */
export default function BorderLayout(props) {
  let classes = ['border-layout'];
  if (props.className) classes.push(props.className);
  let component = null;

  if (props.top==null && props.bottom==null && props.start!=null && props.end!=null) {
    // just a normal Section with Row layout
    component = <Section className={classes.join(' ')} header={props.start} footer={props.end} layout={'row'} {...props}>{props.children}</Section>
  } else if (props.start==null && props.end==null && props.top!=null && props.bottom!=null ) {
    // just a normal Section with col layout
    component = <Section className={classes.join(' ')} header={props.top} footer={props.bottom} layout={'col'} {...props}>{props.children}</Section>
  } else {
    // full border layout
    component = (
      <Section className={classes.join(' ')} header={props.top} footer={props.bottom} {...props}>
        <Section header={props.start} footer={props.end} layout={'row'} height={"100%"}>{props.children}</Section>
      </Section>)
  }

  return component;
}

BorderLayout.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  top: PropTypes.element,
  bottom: PropTypes.element,
  start: PropTypes.element,
  end: PropTypes.element
};
