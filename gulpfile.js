/**
 * @copyright 2021-2023 Markus Leupold-Löwenthal
 *
 * @license AGPL-3.0-or-later
 *
 * This file is part of FreeBeeGee.
 *
 * FreeBeeGee is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * FreeBeeGee is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with FreeBeeGee. If not, see <https://www.gnu.org/licenses/>.
 */

import { readFileSync } from 'fs'
import { deleteAsync } from 'del'

import gulp from 'gulp'
import autoprefixer from 'gulp-autoprefixer'
import changed from 'gulp-changed'
import concat from 'gulp-concat'
import browserify from 'browserify'
import gzip from 'gulp-gzip'
import repl from 'gulp-replace'
import shrinkr from 'shrinkr'
import sort from 'gulp-sort'
import sourcemaps from 'gulp-sourcemaps'
import tar from 'gulp-tar'
import zip from 'gulp-zip'
import vinylSource from 'vinyl-source-stream'

import * as dartSass from 'sass'
import gulpSass from 'gulp-sass'
const sass = gulpSass(dartSass)

const rnd = Math.floor(Math.random() * 10000000)
const p = JSON.parse(readFileSync('./package.json'))

let demomode = false
let site = './'

const subdir = '' // '/xyz/abc'

const dirs = {
  build: 'dist',
  site: 'dist/' + p.name + subdir,
  demo: 'dist/' + p.name + subdir + '/demo',
  docs: 'dist/docs/',
  cache: '.cache'
}

gulp.task('clean', async () => {
  return await deleteAsync([
    `${dirs.build}/${p.name}/**/*`,
    `${dirs.build}/${p.name}/**/.*`,
    `${dirs.build}/*zip`,
    `${dirs.build}/*gz`
  ])
})

gulp.task('clean-cache', async () => {
  return await deleteAsync([
    dirs.cache
  ])
})

// --- build targets -----------------------------------------------------------

/**
 * Replace multiple strings in all files.
 *
 * @param {object} pipe A gulp pipe to work on.
 * @returns {object} Gulp pipe.
 */
function replace (pipe) {
  return pipe
    .pipe(repl('$NAME$', p.name, { skipBinary: true }))
    .pipe(repl('$VERSION$', p.version, { skipBinary: true }))
    .pipe(repl('$ENGINE$', p.versionEngine, { skipBinary: true }))
    .pipe(repl('$CODENAME$', p.codename, { skipBinary: true }))
    .pipe(repl('$BUILD$', rnd, { skipBinary: true }))
    .pipe(repl('$DESCRIPTION$', p.description, { skipBinary: true }))
    .pipe(repl('$COLOR$', p.color, { skipBinary: true }))
    .pipe(repl('$URL$', p.homepage, { skipBinary: true }))
    .pipe(repl('$SERVERLESS$', demomode, { skipBinary: true }))
    .pipe(repl('$SITE$', site, { skipBinary: true }))
}

gulp.task('fonts', () => {
  return gulp.src([
    'src/fonts/*/*woff2'
  ], { encoding: false })
    .pipe(gulp.dest(dirs.site + '/fonts/'))
})

// convert -background none icon.svg -define icon:auto-resize=32,16 favicon.ico
gulp.task('favicon', gulp.series(gulp.parallel(
  // step 1 - generate cached icons
  () => {
    return gulp.src([
      'src/favicon/icon.svg',
      'src/favicon/manifest.webmanifest',
      // pre-converted icons based on icon.svg
      'src/favicon/favicon.ico',
      'src/favicon/png/512.png',
      'src/favicon/png/apple-touch-icon.png',
      'src/favicon/png/192.png'
    ], { encoding: false })
      .pipe(gulp.dest(dirs.cache + '/favicon'))
  }
), () => {
  // step 2 - use cached icons
  return gulp.src([
    dirs.cache + '/favicon/**/*'
  ], { encoding: false })
    .pipe(gulp.dest(dirs.site))
}))

gulp.task('js-vendor', () => {
  return replace(gulp.src([
    'node_modules/@popperjs/core/dist/umd/popper.min.js',
    'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
  ]))
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(dirs.site))
})

gulp.task('js-main', () => {
  return replace(browserify([
    'src/js/app.mjs',
    'src/js/view/room/hotkeys.mjs'
  ], {
    paths: ['src/js']
  })
    .transform('babelify', {
      presets: ['@babel/preset-env']
    })
    .bundle()
    .pipe(vinylSource('main.js')))
    .pipe(gulp.dest(dirs.site))
})

gulp.task('sass', () => {
  return replace(gulp.src([
    'src/scss/style.scss'
  ]))
    .pipe(sourcemaps.init())
    .pipe(concat('style.css'))
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(dirs.site))
})

gulp.task('php', () => {
  // todo: run php -l
  return replace(gulp.src([
    'src/php/**/.*',
    'src/php/**/*'
  ]))
    .pipe(gulp.dest(dirs.site + '/api'))
})

gulp.task('html', () => {
  return replace(gulp.src([
    'src/html/**/*.html',
    'src/misc/.htaccess*',
    'src/misc/robots.txt',
    'src/misc/README.md',
    'docs/INSTALL.md',
    'LICENSE.md'
  ]))
    .pipe(gulp.dest(dirs.site))
})

gulp.task('img', gulp.series(() => {
  // step 1 - optimize backgrounds in high quality
  return gulp.src([
    'src/img/**/*.jpg'
  ], { encoding: false })
    .pipe(shrinkr({
      cacheDir: '.cache/img',
      jpg: { quality: 9 }
    }))
}, () => {
  // step 2 - optimize other assets
  return gulp.src([
    'src/img/**/*.svg',
    'src/img/**/*.png'
  ], { encoding: false })
    .pipe(shrinkr({
      cacheDir: '.cache/img'
    }))
}, () => {
  // step 3 - use cached images
  return gulp.src([
    dirs.cache + '/img/**/*.svg',
    dirs.cache + '/img/**/*.jpg',
    dirs.cache + '/img/**/*.png'
  ], { encoding: false })
    .pipe(gulp.dest(dirs.site + '/img'))
}))

gulp.task('system', () => {
  return replace(gulp.src([
    'src/misc/system/**/.*',
    'src/misc/system/**/*'
  ], { encoding: false }))
    .pipe(gulp.dest(dirs.site + '/system'))
})

/**
 * Create a snapshot zip/tgz.
 *
 * @param {string} name Foldername = filename of snapshot.
 * @param {boolean} minimize If true, the asses/images will be minimized first.
 * @returns {object} Gulp pipe.
 */
function snapshot (name, minimize = false) {
  return gulp.series(() => { // step 1: optimize & cache images
    if (minimize) {
      return gulp.src([
        'src/snapshots/' + name + '/**/*.jpg',
        'src/snapshots/' + name + '/**/*.png',
        'src/snapshots/' + name + '/**/*.svg'
      ], { encoding: false })
        .pipe(shrinkr({
          cacheDir: '.cache/snapshots/' + name,
          jpg: { quality: 7 }
        }))
    } else {
      return gulp.src([
        'src/snapshots/' + name + '/**/*.jpg',
        'src/snapshots/' + name + '/**/*.png',
        'src/snapshots/' + name + '/**/*.svg'
      ], { encoding: false })
        .pipe(changed(dirs.cache + '/snapshots/' + name))
        .pipe(gulp.dest(dirs.cache + '/snapshots/' + name))
    }
  }, () => { // step 2: cache non-images
    return replace(gulp.src([
      'src/snapshots/' + name + '/**/*',
      '!src/snapshots/' + name + '/**/*.jpg',
      '!src/snapshots/' + name + '/**/*.png',
      '!src/snapshots/' + name + '/**/*.svg'
    ], { encoding: false }))
      .pipe(gulp.dest(dirs.cache + '/snapshots/' + name))
  }, () => { // step 3: zip cache
    return gulp.src(dirs.cache + '/snapshots/' + name + '/**/*', { encoding: false })
      .pipe(zip(name + '.zip'))
      .pipe(gulp.dest(dirs.site + '/system/snapshots'))
  })
}

gulp.task('dist', gulp.parallel(
  'js-main',
  'sass',
  'html',
  'js-vendor',
  'php',
  snapshot('RPG'),
  snapshot('Hex'),
  snapshot('Classic'),
  snapshot('Tutorial'),
  snapshot('_'),
  'fonts',
  'img',
  'favicon',
  'system'
))

// --- testing targets ---------------------------------------------------------

gulp.task('test-zips', gulp.parallel(() => {
  return replace(gulp.src(['test/data/snapshots/full/**/*'], { encoding: false }))
    .pipe(zip('full.zip'))
    .pipe(gulp.dest(dirs.cache + '/snapshots'))
}, () => {
  return replace(gulp.src(['test/data/snapshots/empty/**/*'], { encoding: false }))
    .pipe(zip('empty.zip'))
    .pipe(gulp.dest(dirs.cache + '/snapshots'))
}, () => {
  return replace(gulp.src(['test/data/snapshots/extra/**/*'], { encoding: false }))
    .pipe(zip('extra.zip'))
    .pipe(gulp.dest(dirs.cache + '/snapshots'))
}))

gulp.task('dist-test', gulp.series('clean', 'test-zips', 'dist', () => {
  return replace(gulp.src(['test/data/server.json']))
    .pipe(gulp.dest(dirs.site + '/api/data'))
}))

gulp.task('dist-test-api', gulp.series('clean', 'test-zips', gulp.parallel( // only run php stuff
  'php',
  snapshot('RPG', false),
  snapshot('Hex', false),
  snapshot('Classic', false),
  snapshot('Tutorial', false),
  snapshot('_', false)
), () => {
  return replace(gulp.src([
    'test/data/server.json'
  ]))
    .pipe(gulp.dest(dirs.site + '/api/data'))
}))

// --- release targets ---------------------------------------------------------

gulp.task('package-tgz', function () {
  return gulp.src([
    dirs.site + '/**/*',
    '!*.css.map',
    '!*.js.map'
  ], { encoding: false, base: dirs.build, dot: true })
    .pipe(sort())
    .pipe(tar(p.name + '-' + p.version + '.tar'))
    .pipe(gzip({ gzipOptions: { level: 9 } }))
    .pipe(gulp.dest(dirs.build))
})

gulp.task('package-tgz-current', function () {
  return gulp.src([
    dirs.site + '/**/*',
    '!*.css.map',
    '!*.js.map'
  ], { encoding: false, base: dirs.build, dot: true })
    .pipe(sort())
    .pipe(tar(p.name + '-current.tar'))
    .pipe(gzip({ gzipOptions: { level: 9 } }))
    .pipe(gulp.dest(dirs.build))
})

gulp.task('package-zip', function () {
  return gulp.src([
    dirs.site + '/**/*',
    '!*.css.map',
    '!*.js.map'
  ], { encoding: false, base: dirs.build, dot: true })
    .pipe(sort())
    .pipe(zip(p.name + '-' + p.version + '.zip'))
    .pipe(gulp.dest(dirs.build))
})

gulp.task('release', gulp.series(
  'clean',
  'clean-cache',
  'dist',
  'package-tgz',
  'package-tgz-current',
  'package-zip'
))

// --- demo mode (serverless) targets ------------------------------------------

/**
 * Create a demo mode snapshot zip/tgz.
 *
 * @param {string} name Foldername = filename of snapshot.
 * @returns {object} Gulp pipe.
 */
function demo (name) {
  return gulp.series(() => { // step 1: optimize & cache content
    return replace(gulp.src('src/snapshots/' + name + '/**/*', { encoding: false }))
      .pipe(changed(dirs.cache + '/snapshots/' + name))
      .pipe(shrinkr({
        cacheDir: '.cache/snapshots/' + name,
        jpg: { quality: 7 }
      }))
  })
}

/**
 * Copy a demo snapshort to the demo output dir.
 *
 * @param {string} name Foldername = filename of snapshot.
 * @returns {object} Gulp pipe.
 */
function demoDeploy (name) {
  return gulp.series(() => {
    return gulp.src([
      dirs.cache + '/snapshots/' + name + '/**/*',
      'src/misc/demo/snapshots/' + name + '/**/*'
    ], { encoding: false })
      .pipe(gulp.dest(dirs.demo + '/' + name))
  }, () => {
    return gulp.src([
      dirs.cache + '/snapshots/_/**/*'
    ], { encoding: false })
      .pipe(gulp.dest(dirs.demo + '/' + name))
  })
}

gulp.task('demo', gulp.series('clean', () => {
  demomode = true
  site = 'https://freebeegee.org/'
  return gulp.src('tools', { encoding: false })
}, gulp.parallel(
  'js-main',
  'sass',
  'html',
  'js-vendor',
  demo('Classic'),
  demo('RPG'),
  demo('Hex'),
  demo('Classic'),
  demo('_'),
  'fonts',
  'img',
  'favicon'
), gulp.parallel(
  demoDeploy('Classic'),
  demoDeploy('RPG'),
  demoDeploy('Hex'),
  demoDeploy('Tutorial')
), async () => {
  return await deleteAsync([
    `${dirs.build}/demo`
  ])
}, () => {
  return gulp.src([
    `${dirs.site}/**/*`,
    `${dirs.site}/.htaccess*`
  ], { encoding: false })
    .pipe(gulp.dest(`${dirs.build}/demo`))
}))

// --- default target ----------------------------------------------------------

gulp.task('default', gulp.series('dist'))

// --- dev targets -------------------------------------------------------------

gulp.task('watch', gulp.series('dist', function () {
  gulp.watch('src/scss/**/*scss', gulp.series('sass'))
  gulp.watch('src/js/**/*js', gulp.series('js-main'))
  gulp.watch('src/php/**/*php', gulp.series('php'))
}))
