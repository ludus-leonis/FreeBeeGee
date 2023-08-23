<?php

echo("hi");

echo("<pre>");
echo(__FILE__ . PHP_EOL);
echo(dirname(__FILE__) . PHP_EOL);
echo($_SERVER['DOCUMENT_ROOT'] . PHP_EOL);

$scriptDir = substr(dirname(__FILE__), strlen($_SERVER['DOCUMENT_ROOT']));
echo($scriptDir . PHP_EOL);

echo($_SERVER['REQUEST_METHOD'] . PHP_EOL);
echo($_SERVER['REQUEST_URI'] . PHP_EOL);

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
echo($path . PHP_EOL);

echo(substr($path, strlen($scriptDir)));

echo("</pre>");
