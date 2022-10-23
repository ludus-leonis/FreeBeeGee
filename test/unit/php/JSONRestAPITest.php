<?php

/**
 * Copyright 2021-2022 Markus Leupold-Löwenthal
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

namespace com\ludusleonis\freebeegee;

use PHPUnit\Framework\TestCase;

require_once 'src/php/JSONRestAPI.php';

/**
 * JSONRestAPITest - unit tests for JSONRestAPI.
 *
 * Can only test helper methods that do not require a webserver or
 * filesystem access.
 */
final class JSONRestAPITest extends TestCase
{
    private function createApi(
        $docroot = '/src/php'
    ): object {
        global $_SERVER;
        $_SERVER['DOCUMENT_ROOT'] = dirname(__FILE__, 4) . $docroot;
        return new JSONRestAPI();
    }

    public function testDirs(): void
    {
        $repodir = rtrim(dirname(__FILE__, 4), '/'); // tests are run from repo root

        // test docroot installation
        $api = $this->createApi('/src/php');
        $this->assertEquals("$repodir/src/php/data/", $api->getDataDir());
        $this->assertEquals("", $api->getAPIPath());

        // test docroot-subfolder installation
        $api = $this->createApi('');
        $this->assertEquals("$repodir/src/php/data/", $api->getDataDir());
        $this->assertEquals("/src/php", $api->getAPIPath());
    }

    public function testRoutes(): void
    {
        // we can only test postives here, as negatives would set headers and
        // require a webserver to test
        $api = $this->createApi();

        $api->register('GET', '/', function ($caller, $data) {
            return 'GET /';
        });
        $api->register('GET', '/some/?', function ($caller, $data) {
            return 'GET /some';
        });
        $api->register('GET', '/some/more', function ($caller, $data) {
            return 'GET /some/invalid'; // will be overwritten below
        });
        $api->register('GET', '/some/more', function ($caller, $data) {
            return 'GET /some/more';
        });
        $api->register('GET', '/id/:id/id', function ($caller, $data) {
            return 'GET /id/:id/id ' . $data['id'];
        });
        $api->register('GET', '/id/:aid/id/:bid/id', function ($caller, $data) {
            return 'GET /id/:aid/id/:bid/id ' . $data['aid'] . ' ' . $data['bid'];
        });

        $api->register('PUT', '/some/?', function ($caller, $data) {
            return 'PUT /some';
        });
        $api->register('CUSTOM', '/some/?', function ($caller, $data) {
            return 'CUSTOM /some';
        });

        global $_SERVER;
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_SERVER['REQUEST_URI'] = '/';
        $this->assertEquals('GET /', $api->route($this));
        $_SERVER['REQUEST_URI'] = '/some';
        $this->assertEquals('GET /some', $api->route($this));
        $_SERVER['REQUEST_URI'] = '/some/';
        $this->assertEquals('GET /some', $api->route($this));
        $_SERVER['REQUEST_URI'] = '/some?a=b';
        $this->assertEquals('GET /some', $api->route($this));
        $_SERVER['REQUEST_URI'] = '/some/?a=b';
        $this->assertEquals('GET /some', $api->route($this));
        $_SERVER['REQUEST_URI'] = '/some/more';
        $this->assertEquals('GET /some/more', $api->route($this));
        $_SERVER['REQUEST_URI'] = '/id/some/id';
        $this->assertEquals('GET /id/:id/id some', $api->route($this));
        $_SERVER['REQUEST_URI'] = '/id/some/id/other/id';
        $this->assertEquals('GET /id/:aid/id/:bid/id some other', $api->route($this));

        $_SERVER['REQUEST_METHOD'] = 'PUT';
        $_SERVER['REQUEST_URI'] = '/some';
        $this->assertEquals('PUT /some', $api->route($this));
        $_SERVER['REQUEST_URI'] = '/some/';
        $this->assertEquals('PUT /some', $api->route($this));

        $_SERVER['REQUEST_METHOD'] = 'CUSTOM';
        $_SERVER['REQUEST_URI'] = '/some';
        $this->assertEquals('CUSTOM /some', $api->route($this));
        $_SERVER['REQUEST_URI'] = '/some/';
        $this->assertEquals('CUSTOM /some', $api->route($this));
    }

    public function testSanitizePath(): void
    {
        // test docroot installation
        $api = $this->createApi('/src/php');
        $this->assertEquals('', $api->sanitizePath(''));
        $this->assertEquals('/', $api->sanitizePath('/'));
        $this->assertEquals('/.', $api->sanitizePath('/..'));
        $this->assertEquals('/./', $api->sanitizePath('/../'));
        $this->assertEquals('/././', $api->sanitizePath('/..../.../'));
        $this->assertEquals('/g.d/path/', $api->sanitizePath('/g..d/path/'));
        $this->assertEquals('/good/path/', $api->sanitizePath('/good/path/'));
        $this->assertEquals('/bad/path/', $api->sanitizePath('///bad////path///'));
        $this->assertEquals('/bäd/pt h1/', $api->sanitizePath('/bäd/p👆t h1/'));

        // test docroot-subfolder installation
        $api = $this->createApi('');
        $this->assertEquals('', $api->sanitizePath('/src/php'));
        $this->assertEquals('/', $api->sanitizePath('/src/php/'));
        $this->assertEquals('/.', $api->sanitizePath('/src/php/..'));
        $this->assertEquals('/./', $api->sanitizePath('/src/php/../'));
        $this->assertEquals('/././', $api->sanitizePath('/src/php/..../.../'));
        $this->assertEquals('/g.d/path/', $api->sanitizePath('/src/php/g..d/path/'));
        $this->assertEquals('/good/path/', $api->sanitizePath('/src/php/good/path/'));
        $this->assertEquals('/bad/path/', $api->sanitizePath('/src/php///bad////path///'));
        $this->assertEquals('/bäd/pt h1/', $api->sanitizePath('/src/php/bäd/p👆t h1/'));
    }

    public function testMultipartToJson()
    {
        $api = $this->createApi();

        $this->assertEquals(null, $api->multipartToJson());

        global $_SERVER;
        $_SERVER['content-type'] = 'multipart/form-data';
        $this->assertEquals('[]', $api->multipartToJson());

        global $_POST;
        $_POST['name'] = 'Alex';
        $_POST['age'] = '23';
        $this->assertEquals(
            '{"name":"Alex","age":"23"}',
            $api->multipartToJson()
        );

        global $_FILES;
        $_FILES['a'] = 'JPG...';
        $_FILES['b'] = 'PNG...';
        $this->assertEquals(
            '{"name":"Alex","age":"23","_files":["a","b"]}',
            $api->multipartToJson()
        );
    }

    public function testUUID(): void
    {
        $this->assertEquals(
            '74686973-2069-4320-a120-72616e646f6d',
            JSONRestAPI::uuid('this is a random seed')
        );
        $this->assertEquals(
            '74686973-2069-4320-a16e-6f7468657220',
            JSONRestAPI::uuid('this is another random seed'),
        );
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            JSONRestAPI::uuid()
        );
    }

    public function testID(): void
    {
        $this->assertEquals(
            '7468697320697320',
            JSONRestAPI::id('this is a random seed')
        );
        $this->assertEquals(
            '7468697320697320',
            JSONRestAPI::id('this is another random seed')
        );
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{16}$/',
            JSONRestAPI::id()
        );
    }

    public function testSemverSatisfies(): void
    {
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3', '>1.2.2'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3', '<1.2.4'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3', '>=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3', '<=1.2.3'));

        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.2', '1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.3', '1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.4', '1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.2', '1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3', '1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.4', '1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.2', '1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.3', '1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.4', '1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.2', '1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.3', '1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.4', '1.2.3'));

        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.2', '=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.3', '=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.4', '=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.2', '=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3', '=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.4', '=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.2', '=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.3', '=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.4', '=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.2', '=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.3', '=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.4', '=1.2.3'));

        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.2', '~1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.3', '~1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.4', '~1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.2', '~1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3', '~1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.4', '~1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.2', '~1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.3', '~1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.4', '~1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.2', '~1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.3', '~1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.4', '~1.2.3'));

        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.2', '^1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.3', '^1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.4', '^1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.2', '^1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3', '^1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.4', '^1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.3.2', '^1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.3.3', '^1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.3.4', '^1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.2', '^1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.3', '^1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.4', '^1.2.3'));

        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.2', '>1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.3', '>1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.4', '>1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.2', '>1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3', '>1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.4', '>1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.3.2', '>1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.3.3', '>1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.3.4', '>1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('2.3.2', '>1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('2.3.3', '>1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('2.3.4', '>1.2.3'));

        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.2', '>=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.3', '>=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('0.3.4', '>=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.2', '>=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3', '>=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.4', '>=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.3.2', '>=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.3.3', '>=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.3.4', '>=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('2.3.2', '>=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('2.3.3', '>=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('2.3.4', '>=1.2.3'));

        $this->assertTrue(JSONRestAPI::semverSatisfies('0.3.2', '<1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('0.3.3', '<1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('0.3.4', '<1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.2', '<1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3', '<1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.4', '<1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.2', '<1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.3', '<1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.4', '<1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.2', '<1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.3', '<1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.4', '<1.2.3'));

        $this->assertTrue(JSONRestAPI::semverSatisfies('0.3.2', '<=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('0.3.3', '<=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('0.3.4', '<=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.2', '<=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.4', '<=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3', '<=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.4', '<=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.2', '<=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.3.3', '<=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.2', '<=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.3', '<=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.3.4', '<=1.2.3'));

        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-beta', '1.2.3-beta'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-beta', '=1.2.3-beta'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-beta', '1.2.3-alpha'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-beta', '=1.2.3-alpha'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-beta', '1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-beta', '=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3', '1.2.3-alpha'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3', '=1.2.3-alpha'));

        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-dev', '>1.2.2'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-dev', '>1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-dev', '>1.2.4'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-beta', '>1.2.3-alpha'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-beta', '>1.2.3-beta'));

        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-dev', '<1.2.2'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-dev', '<1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-dev', '<1.2.4'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-alpha', '<1.2.3-beta'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-beta', '<1.2.3-beta'));

        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-dev', '>=1.2.2'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-dev', '>=1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-dev', '>=1.2.4'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-dev', '>=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-beta', '>=1.2.3-beta'));

        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-dev', '<=1.2.2'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-dev', '<=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-dev', '<=1.2.4'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-dev', '<=1.2.3'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-beta', '<=1.2.3-beta'));

        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-dev', '^1.2.2'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-dev', '^1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-dev', '^1.2.4'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-beta', '^1.2.3-beta'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-beta', '^1.2.3-alpha'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-alpha', '^1.2.3-beta'));

        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-dev', '~1.2.2'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-dev', '~1.2.3'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-dev', '~1.2.4'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-beta', '~1.2.3-beta'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.2.3-beta', '~1.2.3-alpha'));
        $this->assertFalse(JSONRestAPI::semverSatisfies('1.2.3-alpha', '~1.2.3-beta'));

        // snapshot-engine 1.0.0 should work on 1.x but fail on 2.x server
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.0.0', '^1.0.0'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.0.0', '^1.0.0'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.0.1', '^1.0.0'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.1.0', '^1.0.0'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.1.1', '^1.0.0'));
    }
}
