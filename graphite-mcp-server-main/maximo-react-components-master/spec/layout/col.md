A `col` is vertical container that accepts any number of children and visually presents them based on an alignment hint.

The implementation for this should closely follow the css flexbox approach for laying out a column.  (https://css-tricks.com/snippets/css/a-guide-to-flexbox/) 

## Attributes
`width`
* default would wrap child components
* can be any css width unit      

`height`
* default would fill parent container
* can be any css width unit

`halign-children` - horizontal alignment of children
* `start` - aligns everything to the left (default)
* `end` - aligns everything to the right
* `centers` - centers all children in the column

`valign-children` - horizontal alignment of children
* `top` - aligns everything to the top (default)
* `bottom` - aligns everything to the bottom
* `center` - centers the children in the col vertically
* `space-between` - places the children at the top and bottom and evenly spaces addional children in between

`overflow` - how the col will behave when the children are larger than it's visible container
* hidden - hide children that can't fit
* wrap - simply allow the col wrap around adjusting the width if necessary (default)
* scroll - allow the row to scroll and provide scrollbar

