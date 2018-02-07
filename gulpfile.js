//load the gulp plugins needed at the beginning.
var gulp = require("gulp"),
    webpack = require("webpack-stream"),
    uglify = require("gulp-uglify"),
    eslint = require("gulp-eslint"),
    rename = require("gulp-rename"),
    concat = require("gulp-concat"),
    notify = require("gulp-notify"),
    cache = require("gulp-cache"),
    less = require("gulp-less"),
    del = require("del");

//clean up build folder.
gulp.task("clean", function (cb) {
    del(["build/assets/js/*", "build/assets/images/*"], cb)
});

//copy necessary files to build folder.
gulp.task("copy", function () {
    gulp.src("./src/public/images/*")
        .pipe(gulp.dest("./build/assets/images"));
    gulp.src("./src/public/views/*")
        .pipe(gulp.dest("./build"));

});

//webpack components and other static resources into build folder.
gulp.task("bundle", function () {
    gulp.src("./src/app.js")
        .pipe(webpack(require("./webpack.config.js")))
        .pipe(gulp.dest("./build/assets/js/"));
});

gulp.task("lint", function () {
    return gulp.src(["./src/**/*.js"])
        .pipe(eslint({
            configFile: "./.eslintrc"
        }))
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});

//clean and rebuild project.
gulp.task("build", ["lint", "clean", "copy", "bundle"], function () {
    //do any other things needed.
});

gulp.task("noLintBuild", ["clean", "copy", "bundle"]);

//default operation.
gulp.task("default", ["build"]);
