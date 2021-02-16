/**
 * @copyright 2021 Markus Leupold-Löwenthal
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

const p = require('./package.json')
const gulp = require('gulp')
const rnd = Math.floor(Math.random() * 10000000)

const dirs = {
  build: 'dist',
  site: 'dist/' + p.name,
  docs: 'dist/docs/'
}

gulp.task('clean', function () {
  const del = require('del')
  return del([
    [dirs.site] + '/**/*',
    [dirs.site] + '/**/.*',
    [dirs.build] + '/*zip',
    [dirs.build] + '/*gz'
  ])
})

// --- testing targets ---------------------------------------------------

gulp.task('test-js', function () {
  const standard = require('gulp-standard')

  return gulp.src(['src/js/**/*js'])
    .pipe(gulp.dest('/tmp/gulp-pre'))
    .pipe(gulp.dest('/tmp/gulp-post'))
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true,
      quiet: true
    }))
})

gulp.task('test-sass', function () {
  const sassLint = require('gulp-sass-lint')
  return gulp.src(['src/scss/**/*.s+(a|c)ss'])
    .pipe(sassLint({ configFile: '.sass-lint.yml' }))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError())
})

gulp.task('test-php', function () {
  const phpcs = require('gulp-phpcs')
  const phplint = require('gulp-phplint')

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

gulp.task('docs-js', function () {
  const jsdoc = require('gulp-jsdoc3')

  return gulp.src([
    'src/**/*.js'
  ], { read: false })
    .pipe(jsdoc())
})

// --- build targets -----------------------------------------------------------

function replace (pipe) {
  const repl = require('gulp-replace')
  return pipe
    .pipe(repl('$NAME$', p.name, { skipBinary: true }))
    .pipe(repl('$VERSION$', p.version, { skipBinary: true }))
    .pipe(repl('$ENGINE$', p.version, { skipBinary: true }))
    .pipe(repl('$CODENAME$', p.codename, { skipBinary: true }))
    .pipe(repl('$BUILD$', rnd, { skipBinary: true }))
    .pipe(repl('$DESCRIPTION$', p.description, { skipBinary: true }))
    .pipe(repl('$COLOR$', p.color, { skipBinary: true }))
    .pipe(repl('$URL$', p.homepage, { skipBinary: true }))
    .pipe(repl('$CACHE$', p.cache, { skipBinary: true }))
}

gulp.task('fonts', function () {
  return replace(gulp.src([
    'src/fonts/*/*woff2'
  ]))
    .pipe(gulp.dest(dirs.site + '/fonts/'))
})

gulp.task('favicon', function () {
  return replace(gulp.src([
    'src/favicon/**/*'
  ]))
    .pipe(gulp.dest(dirs.site))
})

gulp.task('js-vendor', function () {
  const concat = require('gulp-concat')

  return replace(gulp.src([
    'node_modules/navigo/lib/navigo.min.js',
    'node_modules/@popperjs/core/dist/umd/popper.min.js',
    'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
  ]))
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(dirs.site))
})

gulp.task('js-main', gulp.series('test-js', function () {
  const browserify = require('browserify')
  const babelify = require('babelify')
  const source = require('vinyl-source-stream')

  return replace(browserify([
    'src/js/api.js',
    'src/js/FreeDOM.js',
    'src/js/modal.js',
    'src/js/nav.js',
    'src/js/screen.js',
    'src/js/state.js',
    'src/js/utils.js',
    'src/js/screens/create.js',
    'src/js/screens/error.js',
    'src/js/screens/join.js',
    'src/js/screens/game/index.js',
    'src/js/screens/game/hotkeys.js',
    'src/js/screens/game/mouse.js',
    'src/js/screens/game/state.js',
    'src/js/screens/game/modals/edit.js',
    'src/js/screens/game/modals/help.js',
    'src/js/screens/game/modals/library.js'
  ]).transform(babelify.configure({
    presets: ['@babel/preset-env']
  })).bundle()
    .pipe(source('main.js')))
    .pipe(gulp.dest(dirs.site))
}))

gulp.task('sass', gulp.series('test-sass', function () {
  const sass = require('gulp-sass')
  const concat = require('gulp-concat')
  const autoprefixer = require('gulp-autoprefixer')
  const sourcemaps = require('gulp-sourcemaps')
  const repl = require('gulp-replace')

  return replace(gulp.src([
    'src/scss/style.scss'
  ]))
    .pipe(sourcemaps.init())
    .pipe(concat('style.css'))
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(repl('$CACHE$', p.cache, { skipBinary: true }))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(dirs.site))
}))

gulp.task('php', gulp.series('test-php', function () {
  return replace(gulp.src([
    'src/php/**/*php',
    'src/php/.htaccess*',
    'src/php/**/*.json'
  ]))
    .pipe(gulp.dest(dirs.site + '/api'))
}))

gulp.task('html', function () {
  return replace(gulp.src([
    'src/html/**/*.html',
    'src/misc/.htaccess*',
    'src/misc/robots.txt',
    'src/misc/README.md',
    'LICENSE.md'
  ]))
    .pipe(gulp.dest(dirs.site))
})

gulp.task('img', function () {
  const image = require('gulp-image')

  return gulp.src([
    'src/img/**/*.jpg',
    'src/img/**/*.png'
  ])
    .pipe(image({
      optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force'],
      pngquant: ['--speed=1', '--force', 256],
      zopflipng: ['-y', '--lossy_8bit', '--lossy_transparent'],
      jpegRecompress: ['--strip', '--quality', 'medium', '--min', 40, '--max', 80],
      mozjpeg: ['-optimize', '-progressive'],
      gifsicle: ['--optimize'],
      svgo: ['--enable', 'cleanupIDs', '--disable', 'convertColors']
    }))
    .pipe(gulp.dest(dirs.site + '/img'))
})

function template (name) {
  const zip = require('gulp-zip')

  return replace(gulp.src('src/templates/' + name + '/**/*'))
    .pipe(zip(name + '.zip'))
    .pipe(gulp.dest(dirs.site + '/templates'))
}

gulp.task('template-RPG', function () { return template('RPG') })
gulp.task('template-Classic', function () { return template('Classic') })

gulp.task('build', gulp.parallel(
  'js-main',
  'sass',
  'html',
  'js-vendor',
  'php',
  'template-RPG',
  'template-Classic',
  'fonts',
  'img',
  'favicon'
))

gulp.task('dist', gulp.parallel('build'))

gulp.task('release', gulp.series(
  'clean',
  'build'
))

// --- release targets ---------------------------------------------------------

gulp.task('package-tgz', function () {
  const tar = require('gulp-tar')
  const gzip = require('gulp-gzip')
  const sort = require('gulp-sort')

  return gulp.src([
    dirs.site + '/**/*',
    '!*.css.map',
    '!*.js.map'
  ], { base: dirs.build, dot: true })
    .pipe(sort())
    .pipe(tar(p.name + '-' + p.version + '.tar'))
    .pipe(gzip({ gzipOptions: { level: 9 } }))
    .pipe(gulp.dest(dirs.build))
})

gulp.task('package-zip', function () {
  const zip = require('gulp-zip')
  const sort = require('gulp-sort')

  return gulp.src([
    dirs.site + '/**/*',
    '!*.css.map',
    '!*.js.map'
  ], { base: dirs.build, dot: true })
    .pipe(sort())
    .pipe(zip(p.name + '-' + p.version + '.zip'))
    .pipe(gulp.dest(dirs.build))
})

gulp.task('release', gulp.series('clean', 'dist', 'package-tgz', 'package-zip'))

// --- default target ----------------------------------------------------------

gulp.task('default', gulp.series('dist'))

// --- dev targets -------------------------------------------------------------

gulp.task('watch', gulp.series('dist', function () {
  gulp.watch('src/scss/**/*scss', gulp.series('sass'))
  gulp.watch('src/js/**/*js', gulp.series('js-main'))
  gulp.watch('src/php/**/*php', gulp.series('php'))
}))
