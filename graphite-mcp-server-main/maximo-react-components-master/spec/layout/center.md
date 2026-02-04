A `center` component would take a single child and center it in a container.

* `vertical` if true then center the child vertically
* `horizontal` if true then center the child horizontally (default)

eg, If we had something like

```xml
<container width="300px" height="300px">
    <center vertical="true" horizontal="true">
        <text value="Hello"/>
    </center>
</container>
```

We'd expect `Hello` to be exactly centered in the 300x300 box.