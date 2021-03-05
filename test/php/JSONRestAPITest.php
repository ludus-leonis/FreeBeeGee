<?php

namespace com\ludusleonis\freebeegee;

use PHPUnit\Framework\TestCase;

require_once 'src/php/JSONRestAPI.php';


final class JSONRestAPITest extends TestCase
{
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
    }
}
