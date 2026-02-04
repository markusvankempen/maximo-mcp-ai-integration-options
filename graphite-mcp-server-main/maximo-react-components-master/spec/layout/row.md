A `row` is horizontal container that accepts any number of children and visually presents them based on an alignment hint.

The implementation for this should closely follow the css flexbox approach for laying out a row.  (https://css-tricks.com/snippets/css/a-guide-to-flexbox/) 

## Attributes
`width`
* default would fill parent container
* can be any css width unit      

`height`
* default would wrap child components
* can be any css width unit

`halign-children` - horizontal alignment of children
* `start` - aligns everything to the left (default)
* `end` - aligns everything to the right
* `space-between` - aligns children at the start and end with space in between evenly
* `centers` - centers all children in the row

`valign-children` - horizontal alignment of children
* `top` - aligns everything to the top (default)
* `bottom` - aligns everything to the bottom
* `center` - centers the children in the row vertically

`overflow` - how the row will behave when the children are larger than it's visible container
* hidden - hide children that can't fit
* wrap - simply allow the row wrap around adjusting the height if necessary (default)
* scroll - allow the row to scroll and provide scrollbar

