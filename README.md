# Tensorflow Visualization - Visual ML with Tensorflow.JS

This project provides a way to perform visul ML with Tensorflow.JS

## Setup

This application is using UI components (grid, toolbar, input fields) from ExtReact library:
https://www.sencha.com/products/extreact/

To run 
    
    npm install

you need to get access to private repo hosting ExtReact:

### Step 1: Sign Up

Start a free trial of ExtReact - https://www.sencha.com/products/extreact/evaluate/

### Step 2: Login to the NPM repository

```
npm login --registry=http://npm.sencha.com --scope=@sencha
```

## Running

Run the following build and run this app:

    npm install
    npm start

This will start the app and open it in a browser window.  By default it tries to find
an open port starting with 1962.  You can override the default port by providing `--env.port=(port)` 
as a command line argument.

For example to use port 8081:

    npm start -- --env.port=8081

You can also run and serve a production build using:

    npm run build
    npm run prod
