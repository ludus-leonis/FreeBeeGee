<?php

namespace com\ludusleonis\freebeegee;

use PHPUnit\Framework\TestCase;

require_once 'src/php/JSONRestAPI.php';


final class JSONRestAPITest extends TestCase
{
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

        // template-engine 1.0.0 should work on 1.x but fail on 2.x server
        $this->assertFalse(JSONRestAPI::semverSatisfies('2.0.0', '^1.0.0'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.0.0', '^1.0.0'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.0.1', '^1.0.0'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.1.0', '^1.0.0'));
        $this->assertTrue(JSONRestAPI::semverSatisfies('1.1.1', '^1.0.0'));
    }
}
