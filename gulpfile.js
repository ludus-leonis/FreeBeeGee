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
import rename from 'gulp-rename'
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
    .pipe(repl('$DEMOMODE$', demomode, { skipBinary: true }))
    .pipe(repl('$SITE$', site, { skipBinary: true }))
}

gulp.task('fonts', () => {
  return replace(gulp.src([
    'src/fonts/*/*woff2'
  ]))
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
    ])
      .pipe(gulp.dest(dirs.cache + '/favicon'))
  }
), () => {
  // step 2 - use cached icons
  return gulp.src([
    dirs.cache + '/favicon/**/*'
  ])
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
    'src/js/main.mjs',
    'src/js/view/room/hotkeys.mjs'
  ], {
    paths: ['src/js']
  })
    .transform('babelify', { presets: ['@babel/preset-env'] })
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
    'src/php/**/*php',
    'src/php/.htaccess*',
    'src/php/**/*.json'
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
  ])
    .pipe(changed(dirs.cache + '/img'))
    .pipe(shrinkr({
      jpg: { quality: 9 }
    }))
    .pipe(gulp.dest(dirs.cache + '/img'))
}, () => {
  // step 2 - optimize other assets
  return gulp.src([
    'src/img/**/*.svg',
    'src/img/**/*.png'
  ])
    .pipe(changed(dirs.cache + '/img'))
    .pipe(shrinkr())
    .pipe(gulp.dest(dirs.cache + '/img'))
}, () => {
  // step 3 - use cached images
  return gulp.src([
    dirs.cache + '/img/**/*.svg',
    dirs.cache + '/img/**/*.jpg',
    dirs.cache + '/img/**/*.png'
  ])
    .pipe(gulp.dest(dirs.site + '/img'))
}))

/**
 * Create a snapshot zip/tgz.
 *
 * @param {string} name Foldername = filename of snapshot.
 * @param {boolean} minimize If true, the asses/images will be minimized first.
 * @returns {object} Gulp pipe.
 */
function snapshot (name, minimize = true) {
  return gulp.series(() => { // step 1: optimize & cache images
    if (minimize) {
      return gulp.src([
        'src/snapshots/' + name + '/**/*.jpg',
        'src/snapshots/' + name + '/**/*.png',
        'src/snapshots/' + name + '/**/*.svg'
      ])
        .pipe(changed(dirs.cache + '/snapshots/' + name))
        .pipe(shrinkr({
          jpg: { quality: 7 }
        }))
        .pipe(gulp.dest(dirs.cache + '/snapshots/' + name))
    } else {
      return gulp.src([
        'src/snapshots/' + name + '/**/*.jpg',
        'src/snapshots/' + name + '/**/*.png',
        'src/snapshots/' + name + '/**/*.svg'
      ])
        .pipe(changed(dirs.cache + '/snapshots/' + name))
        .pipe(gulp.dest(dirs.cache + '/snapshots/' + name))
    }
  }, () => { // step 2: cache non-images
    return replace(gulp.src([
      'src/snapshots/' + name + '/**/*',
      '!src/snapshots/' + name + '/**/*.jpg',
      '!src/snapshots/' + name + '/**/*.png',
      '!src/snapshots/' + name + '/**/*.svg'
    ]))
      .pipe(gulp.dest(dirs.cache + '/snapshots/' + name))
  }, () => { // step 3: zip cache
    return gulp.src(dirs.cache + '/snapshots/' + name + '/**/*')
      .pipe(zip(name + '.zip'))
      .pipe(gulp.dest(dirs.site + '/api/data/snapshots'))
  })
}

gulp.task('dist', gulp.parallel(
  'js-main',
  'sass',
  'html',
  'js-vendor',
  'php',
  snapshot('RPG', false),
  snapshot('Hex', false),
  snapshot('Classic', false),
  snapshot('Tutorial', false),
  snapshot('_', false),
  'fonts',
  'img',
  'favicon'
))

// --- testing targets ---------------------------------------------------------

gulp.task('test-zips', gulp.parallel(() => {
  return replace(gulp.src(['test/data/snapshots/full/**/*']))
    .pipe(zip('full.zip'))
    .pipe(gulp.dest(dirs.cache + '/snapshots'))
}, () => {
  return replace(gulp.src(['test/data/snapshots/empty/**/*']))
    .pipe(zip('empty.zip'))
    .pipe(gulp.dest(dirs.cache + '/snapshots'))
}, () => {
  return replace(gulp.src(['test/data/snapshots/extra/**/*']))
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
  ], { base: dirs.build, dot: true })
    .pipe(sort())
    .pipe(tar(p.name + '-' + p.version + '.tar'))
    .pipe(gzip({ gzipOptions: { level: 9 } }))
    .pipe(gulp.dest(dirs.build))
    .pipe(rename(p.name + '-current.tar.gz'))
    .pipe(gulp.dest(dirs.build))
})

gulp.task('package-zip', function () {
  return gulp.src([
    dirs.site + '/**/*',
    '!*.css.map',
    '!*.js.map'
  ], { base: dirs.build, dot: true })
    .pipe(sort())
    .pipe(zip(p.name + '-' + p.version + '.zip'))
    .pipe(gulp.dest(dirs.build))
})

gulp.task('release', gulp.series(
  'clean',
  'clean-cache',
  'dist',
  'package-tgz',
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
    return replace(gulp.src('src/snapshots/' + name + '/**/*'))
      .pipe(changed(dirs.cache + '/snapshots/' + name))
      .pipe(shrinkr({
        jpg: { quality: 7 }
      }))
      .pipe(gulp.dest(dirs.cache + '/snapshots/' + name))
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
    ])
      .pipe(gulp.dest(dirs.demo + '/' + name))
  }, () => {
    return gulp.src([
      dirs.cache + '/snapshots/_/**/*'
    ])
      .pipe(gulp.dest(dirs.demo + '/' + name))
  })
}

gulp.task('demo', gulp.series('clean', () => {
  demomode = true
  site = 'https://freebeegee.org/'
  return gulp.src('tools')
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
  ])
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
