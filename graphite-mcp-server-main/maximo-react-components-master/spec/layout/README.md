Layout components are non-visual presentational components.  The reason to create these components is primarily to offer a structured way for other components to layout child elements in containers without specifically having to learn css.  For example, in html, just to center a `div` could be done in about 12 different ways.  When developers are left to do this manually, we might end up with 5-6 different code fragments that end up doing the same thing.  So, introducing basic layout components helps ensure that we have a common way to layout containers.

Layout components are essentially contracts between the developer and UI.

The following is an incomplete list of possible layout components
* `row` - align children horizontally
* `col` - children vertically
* `center` - centers a child inside a container
* `border-layout` - layout with placholders for top, bottom, start and end, where everything is expanded to fit the parent container
* `full-page` - layout that expands to fill the entire viewport
* `vertical-panel-layout` - A column with 3 rows for header, content, and footer.  Content should auto expand the container.
* `horizontal-panel-layout` - A row with 3 columns for start, content, and end, where content should auto expand the container.

As we build out the framework and uncover more layout patterns, then we should build them out here.  We should also consider that as we implement these components, we might decide to eliminate some if we think the might be redundant.  We should keep an open mind.

Some guidelines as we build out these components.
* Each component should be stateless and perform well.  There should be a minimal amount of logic in each component.
* These components can be functional components
* Each implementation should be built using standards compliant css.
* We should avoid doing logic in the component, like, `if IE`, etc.  If we discover that IE needs a specific component because it is unique and non-compliant, then we'll create an IE specific version of that component.  ie, we might have something like, `BorderLayout.js` and `ie/BorderLayout.js`.  As much as possible we want to keep the our components performing well, with minimal amount of code and logic.  If we can accomodate browser specifics in the CSS only, then, we should try that, but either put the browser specific code in a different css, or, clearly comment it in a single css.

When dealing with the `left` and `right` alignments, we should always use `start` and `end` respectively.  `start` and `end` are abstract terms that allow for easier bidi/rtl support.  (ie, in bidi/rtl, `start` is the `right` of the page).

The implementation, in css, for a component's rtl support, should be in a `rtl` folder.