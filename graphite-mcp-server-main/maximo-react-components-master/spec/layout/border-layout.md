A `border-layout` component is a component that automatically assumes 100% width and height of it's parent container and adds slots or (element properties in react) for the `top`, `bottom`, `start` and `end`.  The body would assume 100% of unused space both vertically and horizontally.

This is a common patten used in page layout, card layouts, etc.  It is extremely hard to do in CSS but it can be done a number of ways, including table layout, flex layout, or grid layout.

The basic contract here, is that when this is used, the header and footer may be sticky to the top and bottom, such that if my my content is minimal my footer is still positioned at the bottom of the parent container.  Nothing that happens inside this component should cause the parent container to scroll.

All slots, if not set, should be sized to 0.

Any `children` of this layout are added to the content (ie, middle) area of this component.

There some variation on this component for which we may need to provide implementations.  Each implementation should be a new component, and not be mix of if/else logic in a single component.

Some variations might include how we render the 4 areas.  In the default scenario, the header and footer are 100% width and the middle is the start, content, and end.

Another scenario might be that the start, middle, end, is 100% height, and the middle is the header, content, and footer.

Other scenarios might cover how the start/end sections behave when sized and expanded.  eg, if I have content in the start container and the width of the start container is 0px, and then I expand it to 300 (ie, like a drawer), do I shrink the content, or does the start panel cover the content.  In it's default behaviour any sizings to top,bottom,start and end, simply cause the content (middle) to auto shrink/expand.  (grid/flex can accomplish this).

So, instead of creating a single component that can adjust many different ways, we might decide to create separate specific components to implement certain behaviours.  IN this way, testing would be easier, and there would be less side effects of behaviours if implementations change, etc.

