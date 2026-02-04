The panel layouts, ie, `vertical-panel-layout` and `horizontal-panel-layout` might not be needed, if the `border-layout` is efficient.

Basically a `vertical-panel-layout` is a `border-layout` without a `start` and `end`.  ie, you have header row and footer row that is pegged at the top and bottom, and the middle is a content area that is 100% sized to fill all remaining space.

A `horizontal-panel-layout` is a `border-layout` without a `header` and `footer`.  ie, you have a start and end area that is pegged at the left and right, and the middle is a content area that is 100% sized to fill all remaining space.

The nice thing about React is that creating composition components especially as functional components is quite easy.  So, we might decide to use BorderLayout as the implementation in each of these.  ie, in the following implementation for VerticalPanelLayout,

```typescript jsx
<VerticalPanelLayout top={header} bottom={footer}>
    <Text value="hello"/>
</VerticalPanelLayout>
```

We might implement it as simply...

```typescript jsx
function VerticalPanelLayout (props) {
    return <BorderLayout top={props.top} bottom={footer}>{props.children}</BorderLayout> 
}
```

What this allows is that in using VerticalPanelLayout we adhere to it's contract of a 3 row component, and we make it clear as to what our visual intention is.  Under the hood if we decide that BorderLayout is inefficent, then we can simply replace the implementation with something better, later.

The main use case for using panel layouts is basically for the visual implementation of cards, panels, sections, etc, where each of these have a header, footer, and content, but, the visual implementation are very different.