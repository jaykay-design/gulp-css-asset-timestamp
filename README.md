gulp-css-asset-timestamp
=================

Gulp plugin that searches for asset references (URLs) and replaces them
with a cache busted representation.

![Build Status](https://github.com/jaykay-design/gulp-css-asset-timestamp/actions/workflows/node.js.yml/badge.svg)

## Install

    npm install --save-dev gulp-css-asset-timestamp

## Usage

Options with default values shown:

    timestamp({
      assetRoot: '',
      assetURL: '/',
      tokenRegExp: /url\((?:['"]*)([^\'")]+)(?:['"]*)\)/g
    })

- `assetRoot`: points to the root folder containing assets e.g. 'dist/'
- `urlRegExp`: pattern that describes how asset references are presented in the CSS files
    - The default setting uses the default CSS syntac for urls like: `background-image: url('assets/images/pingu.jpg');`
    - This option is usually left as-is
- `assetURL`: To add an absolute prefix for example 'https://example.com'

## Example

Given a CSS file with the following content:

    .logo {
      width: 200px;
      background: url(assets/images/logo.svg);
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }

    .logo-basic {
      width: 80px;
      background: url(assets/images/logo-basic.png);
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }


We can build the following gulpfile tasks:

    var timestamp = require('gulp-css-asset-timestamp');
    var gulp = require('gulp');

    gulp.task('styles', function() {
      return gulp.src('assets/styles/themes/*.css')
        .pipe(timestamp({
          assetRoot: 'dist',
          assetURL : 'https://cdn.mysite.com/'
        }))
         .pipe(gulp.dest('dist/assets/styles/'));
    });

results in:

    .logo {
      width: 200px;
      background: url(https://cdn.mysite.com/dist/assets/images/logo.svg?v=28438725454);
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }

    .logo-basic {
      width: 80px;
      background: url(https://cdn.mysite.com/dist/assets/images/logo-basic.png?v=45798725354);
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }

## License

MIT © John Caprez

