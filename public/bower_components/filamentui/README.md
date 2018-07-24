# Filament UI 

This repository is specifically for developing UI components used in any Filament app. There are a couple of test pages where you can see the output of that development, and the following guide also explains how to export the library for use in other applications. 

## Installation

Installation is simple, follow these steps : 

```
npm install
npm install --dev
```
This will install the npm dependancies. Now you can build the code into a single library using the comands below : 

```
gulp
gulp watch
```
Now you will have the relevant libraires in the `dist` folder of this project however to be able to `bower install` it for use in the UI of this project you'll need to link it. This can be done as follows : 

```
cd dist
bower link
cd ..
bower link dist
bower install
```
What this is doing is creating a link from the component in the `dist` folder to a sort of temporary resource. The `bower link dist` essentially installs it, by creating a symlink in the `bower_components` folder to that temporary resource. The final `bower install` command then installs any other dependancies.

## Running the application

As simple as running `npm start`!
The app will then be available via http://localhost:8008/

## Directory Structure

```
.bowerrc                - to specify where to install the bower_components
.gitignore              - make sure we only check in the right things. 
.npmrc                  - found a strange but and had to fix it with this. 
app.js                  - the main server side application. its very simple and just serves the content back. 
bower.json              - front end dependancies. Note that this has a dependancy on 'filamentui' 
dist/                   - where the output of the built libraries go
dist/bower.json         - definition of the package we are creating. Note, this has version numbers etc that can be incremented if needed. Add any other dependancies for the library here.
filamentui/             - contains all the directives, templates and SCSS needed for the library. A source code folder if you will!
gulpfile.js             - allows us to compile, minify and concat the files together into a single library.
package.json            - server side dependancies
public/                 - contains all the front end pages & routes for testing the library. Don't create directives for the library in this folder.
README.md               - the file you are reading.
```

## Using the library in an angular app.

Assuming you've either installed the library via the `bower link` command mentioned above, or copied in the contents of the `dist` folder, the following is how to use it... 

```
<!-- 3rd party Javascript & CSS used by Filament UI -->
<script src="bower_components/moment/moment.js"></script>
<link   href="bower_components/font-awesome/css/font-awesome.min.css" rel="stylesheet" >

<!-- the module code, built via gulp, gulp watch --> 
<script src="bower_components/dist/filamentui.templates.js"></script>
<script src="bower_components/dist/filamentui.js"></script>
<link   href="bower_components/dist/filamentui.css" rel="stylesheet" >
<!-- end module code -->
```

Then, inside you front end main application ( ie `app.js` ) add the dependancy. 

```
var app = angular.module('filamentuiDemo', [
    'ui.router',
    'filamentui'
]);
```
Specifically, adding the '`filamentui`' dependancy. 

## To Do

- settings icon ( just like help one )
- be able to add a row to a table quickly

## Notes

Demo application throws an error in console, [$injector:unpr]. Don't worry about it.