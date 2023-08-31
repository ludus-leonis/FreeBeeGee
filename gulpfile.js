/**
 * @copyright 2021-2023 Markus Leupold-Löwenthal
 *
 * @license This file is part of FreeBeeGee.
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

import autoprefixer from 'gulp-autoprefixer'
import babelify from 'babelify'
import browserify from 'browserify'
import changed from 'gulp-changed'
import cli from 'docker-cli-js'
import concat from 'gulp-concat'
import eslint from 'gulp-eslint-new'
import gulp from 'gulp'
import gzip from 'gulp-gzip'
import image from 'gulp-image'
import jsdoc from 'gulp-jsdoc3'
import phpcs from 'gulp-phpcs'
import phplint from 'gulp-phplint'
import rename from 'gulp-rename'
import repl from 'gulp-replace'
import sassLint from 'gulp-sass-lint'
import sort from 'gulp-sort'
import source from 'vinyl-source-stream'
import sourcemaps from 'gulp-sourcemaps'
import tar from 'gulp-tar'
import zip from 'gulp-zip'

import dartSass from 'sass'
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

// --- testing targets ---------------------------------------------------

gulp.task('test-js', () => {
  return gulp.src(['src/js/**/*js'])
    .pipe(gulp.dest('/tmp/gulp-pre'))
    .pipe(gulp.dest('/tmp/gulp-post'))
    .pipe(eslint({
      overrideConfigFile: '.eslintrc.cjs'
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})

gulp.task('test-sass', () => {
  return gulp.src(['src/scss/**/*.s+(a|c)ss'])
    .pipe(sassLint({ configFile: '.sass-lint.yml' }))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError())
})

gulp.task('test-php', () => {
  return gulp.src([
    'src/php/**/*.php'
  ])
    .pipe(phplint('', { skipPassedFiles: true }))
    .pipe(phpcs({
      bin: 'tools/phpcs.phar',
      standard: 'PSR12',
      colors: 1,
      warningSeverity: 0
    }))
    .pipe(phpcs.reporter('log'))
    .pipe(phpcs.reporter('fail'))
})

gulp.task('tests', gulp.series('test-sass', 'test-js', 'test-php'))

// --- docs targets ------------------------------------------------------------

gulp.task('docs-js', () => {
  return gulp.src([
    'src/**/*.js'
  ], { read: false })
    .pipe(jsdoc())
})

// --- build targets -----------------------------------------------------------

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

gulp.task('js-main', gulp.series('test-js', () => {
  return replace(browserify([
    'src/js/app.mjs',
    'src/js/main.mjs',
    'src/js/api/index.mjs',
    'src/js/api/serverless.mjs',
    'src/js/lib/FreeDOM.mjs',
    'src/js/lib/utils.mjs',
    'src/js/lib/icons.mjs',
    'src/js/state/index.mjs',

    'src/js/view/screen.mjs',
    'src/js/view/setup/index.mjs',
    'src/js/view/error/index.mjs',
    'src/js/view/join/index.mjs',

    'src/js/view/room/index.mjs',
    'src/js/view/room/modal.mjs',
    'src/js/view/room/hotkeys.mjs',
    'src/js/view/room/sync.mjs',
    'src/js/view/room/modal/demo.mjs',
    'src/js/view/room/modal/disabled.mjs',
    'src/js/view/room/modal/help.mjs',
    'src/js/view/room/modal/inactive.mjs',
    'src/js/view/room/library/index.mjs',
    'src/js/view/room/modal/piece/index.mjs',
    'src/js/view/room/modal/piece/note.mjs',
    'src/js/view/room/modal/piece/other.mjs',
    'src/js/view/room/modal/piece/tile.mjs',
    'src/js/view/room/modal/piece/token.mjs',
    'src/js/view/room/modal/settings.mjs',
    'src/js/view/room/mouse/_MouseButtonHandler.mjs',
    'src/js/view/room/mouse/Grab.mjs',
    'src/js/view/room/mouse/index.mjs',
    'src/js/view/room/mouse/Los.mjs',
    'src/js/view/room/mouse/SelectAndDrag.mjs',
    'src/js/view/room/mouse/SelectAndProperties.mjs',
    'src/js/view/room/tabletop/index.mjs',
    'src/js/view/room/tabletop/tabledata.mjs'
  ], {
    paths: ['src/js']
  }).transform(babelify.configure({
    presets: ['@babel/preset-env']
  })).bundle()
    .pipe(source('main.js')))
    .pipe(gulp.dest(dirs.site))
}))

gulp.task('sass', gulp.series('test-sass', () => {
  return replace(gulp.src([
    'src/scss/style.scss'
  ]))
    .pipe(sourcemaps.init())
    .pipe(concat('style.css'))
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(dirs.site))
}))

gulp.task('php', gulp.series('test-php', () => {
  return replace(gulp.src([
    'src/php/**/*php',
    'src/php/.htaccess*',
    'src/php/**/*.json'
  ]))
    .pipe(gulp.dest(dirs.site + '/api'))
}))

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
    .pipe(image({
      jpegRecompress: ['--strip', '--quality', 'veryhigh', '--min', 70, '--max', 90],
      mozjpeg: false // ['-optimize', '-progressive']
    }))
    .pipe(gulp.dest(dirs.cache + '/img'))
}, () => {
  // step 2 - optimize other assets
  return gulp.src([
    'src/img/**/*.svg',
    'src/img/**/*.png'
  ])
    .pipe(changed(dirs.cache + '/img'))
    .pipe(image({
      optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force'],
      pngquant: ['--speed=1', '--force', 256],
      zopflipng: ['-y', '--lossy_8bit', '--lossy_transparent'],
      gifsicle: ['--optimize'],
      svgo: ['--enable', 'cleanupIDs', '--disable', 'convertColors']
    }))
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

function snapshot (name, minimize = true) {
  return gulp.series(() => { // step 1: optimize & cache content
    if (minimize) {
      return replace(gulp.src('src/snapshots/' + name + '/**/*'))
        .pipe(changed(dirs.cache + '/snapshots/' + name))
        .pipe(image({
          optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force'],
          pngquant: ['--speed=1', '--force', 256],
          zopflipng: ['-y', '--lossy_8bit', '--lossy_transparent'],
          jpegRecompress: ['--strip', '--quality', 'high', '--min', 60, '--max', 85],
          mozjpeg: ['-optimize', '-progressive'],
          gifsicle: ['--optimize'],
          svgo: ['--enable', 'cleanupIDs', '--disable', 'convertColors']
        }))
        .pipe(gulp.dest(dirs.cache + '/snapshots/' + name))
    } else {
      return replace(gulp.src('src/snapshots/' + name + '/**/*'))
        .pipe(changed(dirs.cache + '/snapshots/' + name))
        .pipe(gulp.dest(dirs.cache + '/snapshots/' + name))
    }
  }, () => { // step 2: zip cache
    return gulp.src(dirs.cache + '/snapshots/' + name + '/**/*')
      .pipe(zip(name + '.zip'))
      .pipe(gulp.dest(dirs.site + '/api/data/snapshots'))
  })
}

gulp.task('snapshot-Classic', snapshot('Classic', false))
gulp.task('snapshot-RPG', snapshot('RPG', false))
gulp.task('snapshot-Hex', snapshot('Hex', false))
gulp.task('snapshot-Tutorial', snapshot('Tutorial', false))
gulp.task('snapshot-System', snapshot('_', false))

gulp.task('build', gulp.parallel(
  'js-main',
  'sass',
  'html',
  'js-vendor',
  'php',
  'snapshot-RPG',
  'snapshot-Hex',
  'snapshot-Classic',
  'snapshot-Tutorial',
  'snapshot-System',
  'fonts',
  'img',
  'favicon'
))

gulp.task('dist', gulp.parallel('build'))

// --- testing targets ---------------------------------------------------------

gulp.task('test-zips', gulp.parallel(() => {
  return replace(gulp.src([
    'test/data/snapshots/full/**/*'
  ]))
    .pipe(zip('full.zip'))
    .pipe(gulp.dest(dirs.cache + '/snapshots'))
}, () => {
  return replace(gulp.src([
    'test/data/snapshots/empty/**/*'
  ]))
    .pipe(zip('empty.zip'))
    .pipe(gulp.dest(dirs.cache + '/snapshots'))
}, () => {
  return replace(gulp.src([
    'test/data/snapshots/extra/**/*'
  ]))
    .pipe(zip('extra.zip'))
    .pipe(gulp.dest(dirs.cache + '/snapshots'))
}))

gulp.task('dist-test', gulp.series('clean', 'test-zips', 'dist', () => {
  return replace(gulp.src([
    'test/data/server.json'
  ]))
    .pipe(gulp.dest(dirs.site + '/api/data'))
}))

gulp.task('dist-test-api', gulp.series('clean', 'test-zips', gulp.parallel( // only run php stuff
  'php',
  'snapshot-RPG',
  'snapshot-Hex',
  'snapshot-Classic',
  'snapshot-Tutorial',
  'snapshot-System'
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

// 'release-docker' requires locally installed docker!
gulp.task('release-docker', gulp.series('release', (done) => {
  const docker = new cli.Docker({ echo: true })
  docker.command('build --pull --no-cache -t ghcr.io/ludus-leonis/freebeegee:latest .')
    .then(() => { done() })
}, (done) => {
  const docker = new cli.Docker({ echo: true })
  docker.command('tag ghcr.io/ludus-leonis/freebeegee:latest ghcr.io/ludus-leonis/freebeegee:' + p.version)
    .then(() => { done() })
}, (done) => {
  // run :api tests
  done()
}))

// --- demo mode (serverless) targets ------------------------------------------

function demo (name) {
  return gulp.series(() => { // step 1: optimize & cache content
    return replace(gulp.src('src/snapshots/' + name + '/**/*'))
      .pipe(changed(dirs.cache + '/snapshots/' + name))
      .pipe(image({
        optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force'],
        pngquant: ['--speed=1', '--force', 256],
        zopflipng: ['-y', '--lossy_8bit', '--lossy_transparent'],
        jpegRecompress: ['--strip', '--quality', 'high', '--min', 60, '--max', 85],
        mozjpeg: ['-optimize', '-progressive'],
        gifsicle: ['--optimize'],
        svgo: ['--enable', 'cleanupIDs', '--disable', 'convertColors']
      }))
      .pipe(gulp.dest(dirs.cache + '/snapshots/' + name))
  })
}

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

gulp.task('demo-Classic', demo('Classic'))
gulp.task('demo-RPG', demo('RPG'))
gulp.task('demo-Hex', demo('Hex'))
gulp.task('demo-Tutorial', demo('Tutorial'))
gulp.task('demo-System', demo('_'))
gulp.task('demo-deploy-Classic', demoDeploy('Classic'))
gulp.task('demo-deploy-RPG', demoDeploy('RPG'))
gulp.task('demo-deploy-Hex', demoDeploy('Hex'))
gulp.task('demo-deploy-Tutorial', demoDeploy('Tutorial'))

gulp.task('demo', gulp.series('clean', () => {
  demomode = true
  site = 'https://freebeegee.org/'
  return gulp.src('tools')
}, gulp.parallel(
  'js-main',
  'sass',
  'html',
  'js-vendor',
  'demo-Classic',
  'demo-RPG',
  'demo-Hex',
  'demo-Tutorial',
  'demo-System',
  'fonts',
  'img',
  'favicon'
), gulp.parallel(
  'demo-deploy-Classic',
  'demo-deploy-RPG',
  'demo-deploy-Hex',
  'demo-deploy-Tutorial'
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
