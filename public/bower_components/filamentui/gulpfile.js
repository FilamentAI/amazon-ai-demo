/*!
 * The Ultimate Gulp File
 * $ npm install gulp-sass gulp-autoprefixer gulp-load-plugins gulp-minify-css gulp-jshint gulp-concat gulp-uglify gulp-rename gulp-cache gulp-bower gulp-scss-lint gulp-size gulp-uglify del run-sequence gulp-ng-annotate gulp-ng-templates gulp-plumber gulp-notify gulp-imagemin --save
 */

// Variables
var $ = require('gulp-load-plugins')(),
    gulp = require('gulp'),
    del = require('del'),
    fs = require('fs'),
    runSequence = require('run-sequence'),
    concat = require('gulp-concat'),
    ngAnnotate = require('gulp-ng-annotate'),
    rename = require("gulp-rename"),
    ngTemplates = require('gulp-ng-templates'),
    pngquant = require('imagemin-pngquant'),
    filter = require('gulp-filter'),
    importOnce = require('node-sass-import-once'),

    basePaths = {
        app: 'public/app/',
        filamentui : 'filamentui/',
        vendor : 'vendor/',
        stage: 'public/stage/',
        prod: 'dist/'
    },

    onError = function (err) {
        $.notify.onError({
            title: "Gulp",
            subtitle: "Failure!",
            message: "Error: <%= error.message %>",
            sound: "Beep"
        })(err);
        this.emit('end');
    };

// Styles Task
gulp.task('demoUIStyles', function () {
    return gulp.src([
        basePaths.app + 'scss/**/*.scss',
        basePaths.app + 'scss/**/**/*.scss',
        basePaths.app + 'pages/**/*.scss'
    ])
    .pipe($.plumber({
        errorHandler: onError
    }))
    .pipe($.sass({
        style: 'expanded',
    }))
    .pipe($.autoprefixer('last 2 version'))
    .pipe(gulp.dest(basePaths.stage))
    .pipe($.rename({
        suffix: '.min'
    }))
    .pipe($.minifyCss())
    .pipe(gulp.dest(basePaths.stage));
});

gulp.task('copy_webfonts', function () {
    gulp.src(basePaths.vendor + '/Font-Awesome-5.0/fontawesome-pro-5.0.4/web-fonts-with-css/webfonts/*')
    .pipe(gulp.dest(basePaths.prod + "/webfonts"));
});

// Styles Task
gulp.task('styles', ['copy_webfonts'], function () {
    return gulp.src([
        basePaths.filamentui + 'style/style.scss'
    ])
    .pipe($.plumber({
        errorHandler: onError
    }))
    .pipe($.sass({
        style: 'expanded',
        importer: importOnce
    }))
    .pipe($.concat('filamentui.css'))
    .pipe(gulp.dest(basePaths.prod))
    .pipe($.rename({
        suffix: '.min'
    }))
    .pipe($.minifyCss())
    .pipe(gulp.dest(basePaths.prod));
});

// Scripts Task
gulp.task('scripts', [], function () {
    return gulp.src([
        basePaths.filamentui + '_module.js',
        basePaths.filamentui + 'directives/**/*.js',
        basePaths.filamentui + 'directives/**/**/**/*.js'
    ])
    .pipe($.plumber({
        errorHandler: onError
    }))
    .pipe(ngAnnotate())
    .pipe($.concat('filamentui.js'))
    .pipe(gulp.dest(basePaths.prod))
    .pipe($.uglify())
    .pipe($.rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest(basePaths.prod));
});

// Style Task
gulp.task('vendor', [], function () {
    return gulp.src([
        basePaths.vendor + '/Font-Awesome-5.0/fontawesome-pro-5.0.4/web-fonts-with-css/css/fontawesome-all.css',
        basePaths.vendor + '/flexboxgrid/dist/flexboxgrid.min.css',
        basePaths.vendor + '/ng-prettyjson/dist/ng-prettyjson.min.css'
    ])
    .pipe($.concat('filamentui.vendor.css'))
    .pipe(gulp.dest(basePaths.prod + "/vendor" ))
});

// Scripts Task
gulp.task('vendorscripts', [], function () {
    return gulp.src([
        basePaths.vendor + '/jquery/dist/jquery.min.js',
        basePaths.vendor + '/moment/moment.js',
        basePaths.vendor + '/ng-prettyjson/dist/ng-prettyjson.min.js'
    ])
    .pipe($.plumber({
        errorHandler: onError
    }))
    .pipe(ngAnnotate())
    .pipe($.concat('filamentui.vendor.js'))
    .pipe(gulp.dest(basePaths.prod + "/vendor" ))
    .pipe($.uglify())
    .pipe($.rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest(basePaths.prod + "/vendor" ))
});

// Images Task
gulp.task('imgmin', function() {
    var filterImg = filter(['**/*.png','**/*.jpg']);

    return gulp.src(basePaths.filamentui + 'assets/img/**')
        .pipe(filterImg)
        .pipe($.cache($.imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngquant()]
        })))
        // set up to mimic live apps
        // default pictures should be copied to similar locations if required
        .pipe(gulp.dest('public/_img'));
});

// templates...
gulp.task('templates', [], function () {
    return gulp.src([
        basePaths.filamentui + 'directives/**/*.html',
        basePaths.filamentui + 'directives/**/**/*.html',
        basePaths.filamentui + 'directives/**/**/**/*.html',
        basePaths.filamentui + 'directives/**/**/**/**/*.html',

        basePaths.filamentui + 'layouts/**/*.html',
        basePaths.filamentui + 'layouts/**/**/*.html',
        basePaths.filamentui + 'layouts/**/**/**/*.html',
        basePaths.filamentui + 'layouts/**/**/**/**/*.html',

        basePaths.filamentui + 'assets/**/*.html'
    ])
    .pipe(ngTemplates({
        filename: 'filamentui.templates.js',
        module: 'filamentuiTemplates',
        path: function (path, base) {
            var parts = base.split("/");
            return 'filamentui/' + parts[parts.length - 2] + "/" + path.replace(base, '');
        }
    }))
    .pipe(gulp.dest(basePaths.prod));
});

gulp.task('clear', function (done) {
    return $.cache.clearAll(done);
});

// Clean Output Directories
gulp.task('clean', function () {
    del([
        basePaths.stage,
        basePaths.prod + "/*.js",
        basePaths.prod + "/*.css",
    ], {
        read: false
    });
});

// runs all
//   separated from default so that default actions will only run when this completes
gulp.task('build', function(cb) {
    runSequence('clear', 'clean', 'vendor', 'vendorscripts', 'styles', 'scripts', 'imgmin', 'templates', 'demoUIStyles', cb);
});

// Manual Default task - does everything
gulp.task('default', ['build'], function(cb) {
    console.log('build completed!');
    // runs webserver & watch during development
    // use Ctrl+C to end
    gulp.start('watch');
    gulp.start('server');
});

// Start server
gulp.task('server', function() {
    return $.run('npm start').exec();    // run "npm start". 
});

// Watch and auto-reload browser(s).
gulp.task('watch', function () {

    gulp.watch([
        basePaths.app +'scss/**/**/*.scss',
        basePaths.app +'app/**/*.scss'],
               ['demoUIStyles']);

    gulp.watch([
        basePaths.filamentui +'**/**/**/*.scss',
        basePaths.filamentui +'**/**/*.scss',
        basePaths.filamentui +'**/*.scss'],
               ['styles']);

    gulp.watch([
        basePaths.filamentui +'*.js',
        basePaths.filamentui +'**/*.js',
        basePaths.filamentui +'**/***.js'],
               ['scripts']);

    gulp.watch([
        basePaths.filamentui + '**/*.html',
        basePaths.filamentui + '**/**/*.html',
        basePaths.filamentui + '**/**/**/*.html',
        basePaths.filamentui + '**/**/**/**/*.html'],
               ['templates']);

});
