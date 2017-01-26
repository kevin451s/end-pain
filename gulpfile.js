var gulp = require('gulp');
///////////////////////////////////////////////////////////////
// Load Modules
///////////////////////////////////////////////////////////////
require('es6-promise').polyfill();

var browserSync = require('browser-sync'),
	clean = require('gulp-clean'),
	concat = require('gulp-concat'),
 	cp = require('child_process'),
 	cssmin = require('gulp-cssmin'),
 	del = require('del'),
 	fs	= require('fs'),
 	gulp = require('gulp'),
 	jshint = require('gulp-jshint'),
 	mqpacker = require('css-mqpacker'),
 	prefix = require('gulp-autoprefixer'),
 	rename = require('gulp-rename'),
 	sass = require('gulp-sass'),
 	size = require('gulp-size'),
 	sourcemaps = require('gulp-sourcemaps'),
 	svgSprite = require('gulp-svg-sprite'),
 	uglify = require('gulp-uglify'),
 	util = require('gulp-util'),
	watch = require('gulp-watch');

///////////////////////////////////////////////////////////////
// Load Config Files
///////////////////////////////////////////////////////////////
var config = require('./config.json');

///////////////////////////////////////////////////////////////
// Browser Sync
///////////////////////////////////////////////////////////////
gulp.task('browserSync', function() {
    browserSync.init({
        proxy: config.localhost
    });
});

///////////////////////////////////////////////////////////////
// Clean Sprite Directory
///////////////////////////////////////////////////////////////
function cleanSpriteTask(key) {
	var taskName = key + 'SvgClean',
		fileName = config.sprite.dist + 'sprite-' + key + '**.svg';

	gulp.task(taskName, function () {
		return gulp.src(fileName, {read: false})
	    	.pipe(clean());
	});
}
///////////////////////////////////////////////////////////////
// Create SVG Sprite
///////////////////////////////////////////////////////////////
function spriteTask(key) {
	var taskName = key + 'Svg',
		taskDir = config.sprite.dir + key + '/*',
		taskSassDest = config.sprite.scss + '_' + key + '.scss',
		taskFileName = 'sprite-' + key + '.svg',
		cleanTask = key + 'SvgClean';

	gulp.task(taskName,[cleanTask],function() {
		return gulp.src(taskDir)
		.pipe(svgSprite({
			shape: {
				dimension : {
					precision : 0,
					attributes : true
				},
				spacing : {
					padding : '1',
					box : 'content'
				}
			},
			mode: {
				css: {
					dest: "",
					layout: "vertical",
					bust: true,
					sprite: taskFileName,
					render: {
						scss: {
							dest: taskSassDest,
							template: config.sprite.tpl
						}
					},
					prefix : key + "--%s",
					recursive : true,
					example : false,
					common : key,
					mixin : key + '-svg'
				}
			}
		}))
		.on('error',util.log)
		.pipe(gulp.dest(config.sprite.dist))
		.pipe(gulp.dest(config.sprite.pub));
	});
};

///////////////////////////////////////////////////////////////
// Register Sprite Task for each sprite defined in config.json
///////////////////////////////////////////////////////////////
var spriteTasks = [],
	cleanSpriteTasks = [],
	svgSprites = config.svg_sprites;

for (i=0;i<svgSprites.length;i++) {
	var val;

	val = svgSprites[i];

	spriteTask(val);
	spriteTasks.push(val + 'Svg');
	cleanSpriteTask(val);
	cleanSpriteTasks.push(val + 'SvgClean');
}

///////////////////////////////////////////////////////////////
// Single task to generate all sprites in config.json
///////////////////////////////////////////////////////////////
gulp.task('svgCompile',spriteTasks, browserSync.reload);

///////////////////////////////////////////////////////////////
// Create SASS Task
///////////////////////////////////////////////////////////////
function sassTask(key) {

	// Sass Task
	var taskName = key + 'Sass',
		taskDir = config.path.scss + key + '.scss';

	gulp.task(taskName,function() {
		return gulp.src(taskDir)
			.pipe(sourcemaps.init())
			.pipe(sass({outputStyle: 'expanded'}))
			.on('error',util.log)
			.pipe(prefix('last 5 version', 'safari 6', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
			.pipe(sourcemaps.write())
			.pipe(gulp.dest(config.path.css));
	});
};

///////////////////////////////////////////////////////////////
// Create Combine Media Qauery Task
///////////////////////////////////////////////////////////////
function sassMqPackTask(key) {

	var taskName = key + 'MqPack',
		taskDir = config.path.css + key + '.css';

	gulp.task(taskName,[key+'Sass'],function () {
		var css = fs.readFileSync(taskDir,'utf8');
		var result = mqpacker.pack(css, {
			from : taskDir,
			map : {
				inline : false
			},
			to : taskDir
		});
		fs.writeFileSync(taskDir, result.css);
		fs.writeFileSync(taskDir + '.map',result.map);
	});
};

///////////////////////////////////////////////////////////////
// Create Combine Media Qauery Task
///////////////////////////////////////////////////////////////
function cssMinTask(key) {

	var taskName = key + 'CssMin',
		taskDir = config.path.css + key + '.css',
		taskMinPath = config.path.css + key + '.min.css',
		pubPath = config.path.cssPub + key + '.min.css';

	gulp.task(taskName,[key+'MqPack'],function () {

		return gulp.src(taskDir)
	        .pipe(cssmin())
	        .on('error',util.log)
	        .pipe(rename({suffix: '.min'}))
	        .pipe(gulp.dest(config.path.css));

		fs.createReadStream(taskMinPath).pipe(fs.createWriteStream(pubPath));
	});
};

///////////////////////////////////////////////////////////////
// Register Sass Task for each stylesheet defined in config.json
///////////////////////////////////////////////////////////////
var sassTasks = [],
    mqPackTasks = [],
	cssMinTasks = [],
	stylesheets = config.stylesheets;

for (i=0;i<stylesheets.length;i++) {

	var val = stylesheets[i];

	sassTask(val);
	sassMqPackTask(val);
	cssMinTask(val);
	sassTasks.push(val + 'Sass');
	mqPackTasks.push(val + 'MqPack');
	cssMinTasks.push(val + 'CssMin');
}
///////////////////////////////////////////////////////////////
// Single task to generate all sass files in config.json
///////////////////////////////////////////////////////////////
gulp.task('sassCompile',cssMinTasks, browserSync.reload);


///////////////////////////////////////////////////////////////
// Js Lint
///////////////////////////////////////////////////////////////
function jsLintTask(key,val) {

	var taskName = key + 'Lint',
		files = [];

	for (i=0;i<val.length;i++) {

		var dir = val[i].dir,
			file = val[i].file;

		file = config.path.jsBuild + file + '.js';

		if (dir !== 'plugins') {
			files.push(file);
		}

	}

	gulp.task(taskName,function() {
		return gulp.src(files)
			.pipe(jshint())
			.pipe(jshint.reporter('default'));
	});
};


///////////////////////////////////////////////////////////////
// JS Concat
///////////////////////////////////////////////////////////////
function jsConcatTask(key,val) {

	var taskName = key + 'Concat',
		lintTask = key + 'Lint',
		output = key + '.js',
		files = [];

	for (i=0;i<val.length;i++) {

		var dir = val[i].dir,
			file = val[i].file;

		if (dir == 'plugins') {
			file = config.path.jsPlugins + file + '.js';
		}

		if (dir == 'build') {
			file = config.path.jsBuild + file + '.js';
		}
		files.push(file);
	}

	gulp.task(taskName,[lintTask],function() {
		return gulp.src(files)
			.pipe(concat(output))
			.on('error',util.log)
			.pipe(gulp.dest(config.path.assets));
	});
};

///////////////////////////////////////////////////////////////
// JS Minify
///////////////////////////////////////////////////////////////
function jsMinifyTask(key) {

	var taskName = key + "Minify",
		concatTask = key + 'Concat',
		input = config.path.assets + key + '.js';

	gulp.task(taskName,[concatTask],function() {
		return gulp.src(input)
			.pipe(uglify({
				mangle: false
			}))
			.on('error',util.log)
			.pipe(rename({ suffix :'.min'}))
			.pipe(gulp.dest(config.path.assets));
	});
};

///////////////////////////////////////////////////////////////
// Register JS Tasks
///////////////////////////////////////////////////////////////
var scripts = config.scripts,
	jsLintTasks = [],
    jsConcatTasks = [],
    jsMinifyTasks = [];

for (var key in scripts) {
	var val;

	if (scripts.hasOwnProperty(key)) {
		val = scripts[key];
	}

	jsLintTask(key,val);
	jsLintTasks.push(key + 'Lint');
	jsConcatTask(key,val);
	jsConcatTasks.push(key + 'Concat');
	jsMinifyTask(key,val);
	jsMinifyTasks.push(key + 'Minify');
}


///////////////////////////////////////////////////////////////
// Single task to run all js tasks.
///////////////////////////////////////////////////////////////
gulp.task('jsCompile',jsMinifyTasks);

///////////////////////////////////////////////////////////////
// Watch Task
///////////////////////////////////////////////////////////////
gulp.task('watch', function() {

	for (var key in config.sprites) {
		var val;

		if (config.sprites.hasOwnProperty(key)) {
			val=config.sprites[key];
		}
		var dir = config.sprite.dir + val + '/*';

		gulp.watch(dir,[val + 'Svg']).on('error',util.log);
	}

	for (var key in config.stylesheets) {
		var val;

		if (config.stylesheets.hasOwnProperty(key)) {
			val=config.stylesheets[key];
		}
		var file = config.path.scss + val + '.scss',
			dir = config.path.scss + val + '/**/*';

		gulp.watch([file,dir], [val + 'MqPack']).on('error',util.log).on('change',browserSync.reload);
	}

	gulp.start('browserSync');
});

// Default Task
gulp.task('default',['svgCompile','sassCompile','jsCompile']);
