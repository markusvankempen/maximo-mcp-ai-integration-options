Layout components are layout contracts where the implementation details are hidden.  For the most part these are non-visual, and are created to help developer ensure a consistent way to layout additional components.

For example,  a `BorderLayout` component is a Layout Contract that knows how to render a top, bottom, start, end, where the content in the middle is always sized to be all remaining space.   If a developer is creating a new Card, then they might use a `BorderLayout` to have some content aligned to the top, bottom, and middle.  By using this contract, the component is guaranteed to achieve this layout.  If later, it is determined that the layout fails for a specific browser, etc, then, the component can be updated, and, any component that used this layout will also work.

Css can be a tricky beast, so, having a foundation set of layout components and accelerate the creation of more complex components. 
