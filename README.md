# a minimal webpack dev environment

## N.B.

This repo is not setup for production. The bundle in dist is still meant for dev only. It is transpiled by babel and put together by webpack but contain sourcemaps and are not minified or anything like that.

## Features

- babel + `babel/polyfill`
- `webpack-dev-server` for live editing of src files
- loaders for css, files (including images)
- CSS autoprefixing with postCSS
- eslint

- lodash is included, mostly just as an example of importing a package

## Not currently included

- any setup for production!
- support for SASS or LESS etc.
- HMR
- testing stuff

## Usage

- `git clone https://github.com/ensconced/webpack_starter`
- `cd ./webpack-starter`
- `npm i`
- `npm start` for live development
- `npm build` for build src into `dist` directory