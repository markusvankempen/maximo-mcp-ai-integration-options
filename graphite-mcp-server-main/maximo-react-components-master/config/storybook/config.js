import {addDecorator, configure} from '@storybook/react';
import {withInfo} from "@storybook/addon-info";

function loadStories() {
  const req = require.context('../../src/', true, /\.story\.js$/);
  req.keys().forEach(filename => req(filename));
}

addDecorator(withInfo);

configure(loadStories, module);
