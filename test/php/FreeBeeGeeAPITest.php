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

require_once 'src/php/FreeBeeGeeAPI.php';

/**
 * FreeBeeGeeAPI - unit tests for FreeBeeGeeAPI.
 *
 * Can only test helper methods that do not require a webserver or
 * filesystem access.
 */
final class FreeBeeGeeAPITest extends TestCase
{
    private function createApi(
        $docroot = '/src/php'
    ): object {
        global $_SERVER;
        $_SERVER['DOCUMENT_ROOT'] = dirname(__FILE__, 3) . $docroot;
        return new FreeBeeGeeAPI();
    }

    public function testFileToAsset()
    {
        $asset = FreeBeeGeeAPI::fileToAsset('a.png');
        $this->assertEquals(['a.png'], $asset->media);
        $this->assertEquals(1, $asset->w);
        $this->assertEquals(1, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('a', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('camelCase.jpeg');
        $this->assertEquals(['camelCase.jpeg'], $asset->media);
        $this->assertEquals(1, $asset->w);
        $this->assertEquals(1, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('camelCase', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('camelCase.caseCamel.SVG');
        $this->assertEquals(['camelCase.caseCamel.SVG'], $asset->media);
        $this->assertEquals(1, $asset->w);
        $this->assertEquals(1, $asset->h);
        $this->assertEquals(1, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('camelCase.caseCamel', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('b.2x3x4.jpg');
        $this->assertEquals(['b.2x3x4.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('b', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('c.22x33x04.jpg');
        $this->assertEquals(['c.22x33x04.jpg'], $asset->media);
        $this->assertEquals(22, $asset->w);
        $this->assertEquals(33, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('c', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('d.2x3x4.invalid.jpg');
        $this->assertEquals(['d.2x3x4.invalid.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#808080', $asset->bg);
        $this->assertEquals('d', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('d.e.2x3x4.abcdef.jpg');
        $this->assertEquals(['d.e.2x3x4.abcdef.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#abcdef', $asset->bg);
        $this->assertEquals('d.e', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('eE.2x3x4.transparent.jpg');
        $this->assertEquals(['eE.2x3x4.transparent.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('transparent', $asset->bg);
        $this->assertEquals('eE', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('eE.2x3x4.1.jpg');
        $this->assertEquals(['eE.2x3x4.1.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('1', $asset->bg);
        $this->assertEquals('eE', $asset->name);
        $this->assertObjectNotHasAttribute('tx', $asset);

        $asset = FreeBeeGeeAPI::fileToAsset('d.e.2x3x4.1-wood.jpg');
        $this->assertEquals(['d.e.2x3x4.1-wood.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('1', $asset->bg);
        $this->assertEquals('wood', $asset->tx);
        $this->assertEquals('d.e', $asset->name);

        $asset = FreeBeeGeeAPI::fileToAsset('d.e.2x3x4.abcdef-wood.jpg');
        $this->assertEquals(['d.e.2x3x4.abcdef-wood.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('#abcdef', $asset->bg);
        $this->assertEquals('wood', $asset->tx);
        $this->assertEquals('d.e', $asset->name);

        $asset = FreeBeeGeeAPI::fileToAsset('soSo.2x3x4.transparent-paper.jpg');
        $this->assertEquals(['soSo.2x3x4.transparent-paper.jpg'], $asset->media);
        $this->assertEquals(2, $asset->w);
        $this->assertEquals(3, $asset->h);
        $this->assertEquals(4, $asset->s);
        $this->assertEquals('transparent', $asset->bg);
        $this->assertEquals('paper', $asset->tx);
        $this->assertEquals('soSo', $asset->name);
    }
}
