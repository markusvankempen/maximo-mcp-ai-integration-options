/**
 * Creates the index.js for all components
 */


const glob = require('glob');
const path = require('path');
const fs = require('fs');

glob('**/*.js', {cwd: 'src', ignore: ['**/*.test.js', '**/*.story.js', '**/index.js']}, function (err, files) {

  if (err) {
    console.log(err);
    process.exit(1);
  }

  // a list of paths to javaScript files in the current working directory
  let out = files.map(e=>{
    let name = path.basename(e, '.js');
    return `export {default as ${name}} from './${e.substring(0, e.length-3)}';`;
  });

  fs.writeFileSync('src/index.js', out.join("\n"));
  console.log('src/index.js updated');
});
