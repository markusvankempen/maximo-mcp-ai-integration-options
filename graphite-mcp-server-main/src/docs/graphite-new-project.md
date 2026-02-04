## Creating new projects
- If it's a non maximo project you can use the command `npx -y @maximo/maxdev-cli create-app -n MYPROJECT`
- If it's a maximo project you can use the command `npx -y @maximo/maxdev-cli create-app -n MYPROJECT -s maximo`

## Accessing artifactory
- Only needed if user is having authorization errors when accessing artifactory
- install `npm install -g yarn shx shelljs eslint`
- isntall `npm  --no-audit --no-fund install -g git+ssh://git@github.ibm.com/maximo-app-framework/flint`
- run `npx flint npm-setup -g`
- this will prompt for your artifactory token, and create the `~/.npmrc` file to access artifactory
