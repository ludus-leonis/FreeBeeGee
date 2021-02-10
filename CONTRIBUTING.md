# Contributing

This project is covered by the [GNU AGPL-3.0](LICENSE.md). If you contribute, it will fall under that license, too.

When contributing code, especially when adding new features, please first propose the change you wish to make via a [GitHub issue](https://github.com/ludus-leonis/FreeBeeGee/issues). This helps to avoid misunderstandings or duplicate effort.

## Help wanted

This project could need help in the following areas:

* Testing and bug reports ([issue tracker](https://github.com/ludus-leonis/FreeBeeGee)).
* Spreading the word.

## Pull Requests

Please submit code changes via pull requests on GitHub:

* One pull request per fix / feature / issue.
* Each commit should focus on one task.
* Use meaningful commit messages. In general, they should start with `added .. `, `changed ...`, `fixed ...` or `removed ...` and describe what happened to the code.
* Development is done from the `develop` branch. Create a feature branch and a pull request back into `develop`.
* Make sure `gulp dist` runs without errors or warnings. This will enforce our coding standards.
* It is helpful if you also run `npm run test` to run the Mocha API tests after server/PHP changes, but that requires a bit more setup on your part (a running server).

## Coding standards

All project files use UTF-8 encoding and Unix-style line endings. There is a `.editorconfig` providing details about our indentation rules.

We use `gulp` as build tool and `npm` as dependency tool.

### Project layout

```
/dist        # generated release files (not in git)
/docs        # documenation for admins and users
/src
  /favicon   # frontend favicon
  /fonts     # frontend webfonts
  /html      # frontend html stubs and a few static pages (terms, privacy)
  /js        # frontend application, written in ES20
  /misc      # supplementary server files like robots.txt
  /php       # backend / API - faceless JSON/Rest server
  /scss      # frontend styles
  /templates # ready-to-use games
/test        # testing code for src
/tools       # scripts/tools/helpers
```

### JavaScript

* This project uses ES2020 features.
* Code is formated using [JavaScript Standard Style](https://standardjs.com/) guidelines. Yes, this means no semicolons. Gulp will check & enforce those rules by using a linter.
* JavaScript code is split into ES modules based on functionality/screen.

Code is automatically converted for older browsers using Babel during build.

### PHP

* All PHP code must adhere the [PSR12 coding standard](https://www.php-fig.org/psr/psr-12/). Gulp will check & enforce that by using a linter.

You will need a local PHP-cli installation so that the linter/phar file can run.

### (S)CSS

* All styles are written in [SCSS](https://sass-lang.com/).
* We follow the [7-1 pattern](https://sass-guidelin.es/#the-7-1-pattern) for naming files.
* We use the `sass-lint` coding standard, with a few exception defined in `.sass-lint.yml`. Gulp will check & enforce that via a plugin.
* FreeBeeGee is partly based on Bootstrap v5 (Reboot, Grid). However, each `*.scss` file only pulls in the modules it needs, not the full Bootstrap CSS.
