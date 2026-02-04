A set of layout, ui, and app components for building Maximo Applications using [React](https://reactjs.org/) and IBM's [Carbon](http://react.carbondesignsystem.com/?knob-The%20title%20%28title%29=Section%201%20title&selectedKind=Accordion&selectedStory=Default&full=0&addons=1&stories=1&panelRight=0&addonPanel=storybook%2Factions%2Factions-panel) components.

[![Build Status](https://travis.ibm.com/maximo-app-framework/maximo-react-components.svg?token=yJyC5zQ7wEuSAyYtDC53&branch=master)](https://travis.ibm.com/maximo-app-framework/maximo-react-components)

# Development

Check out the project and use `yarn` to make sure it's up to date and all tests pass.

If `yarn` is not installed, install `yarn`.
```
$ npm install -g yarn
```

```bash
$ cd maximo-react-components
$ yarn install
$ yarn test
```

If that works, then you can start new development.

## Using StoryBook

```bash
yarn storybook
```

[StoryBook](https://storybook.js.org/basics/introduction/) is a test/design/documentation system for React Components

## Component Files ##
Each component is in the `./src` directory and each component is generally comprised of 4 files.  A `.js` component file, a `.test.js` unit test file (optional), `.css` css file (optional), and a `.story.js` file for the component samples (optional), used by `storybook`. 

The `.test.js` files are executed by the `yarn test` command. 

<!--
Check out https://github.com/tabler/tabler-react for example of a module react library
-->
