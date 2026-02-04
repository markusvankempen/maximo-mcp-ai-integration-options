### Code Oragnization and request flow

The diagram below shows how code is oragnized. The flow starts from mcp-server.js file. This file creates an http/stdio server. When the ai agent calls mcp based apis, it feteches the detials based on the flow below. 

``` mermaid

flowchart TD
    A(["mcp-server"]) --> C["constants/graphite<br>(details and schema)"] & D["handlers<br>(handler function for requests)</br>"]
    C --> n1["tools"] & n2["resources"] & n3["prompts"]
    D --> n4["tool-handler"] & n6["prompt-handler"] & n5["reosurce-handler"]
    n1@{ shape: rect}
    n2@{ shape: rect}
    n3@{ shape: rect}
    n4@{ shape: rect}
    n5@{ shape: rect}

```