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

/**
 * JSONRestAPI - generic parts of a JSON/Rest API.
 *
 * Covers HTTP request routing and provides a few JSON payload helpers.
 */
class JSONRestAPI
{
    public const REGEXP_SEMVER =
        '/^(?P<operator>[=<>^~]*)?(?P<major>0|[1-9]\d*)\.(?P<minor>0|[1-9]\d*)\.(?P<patch>0|[1-9]\d*)' .
        '(?:-(?P<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?'
         . '(?:\+(?P<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/';

    private $http = true; // PHP may set/change http stuff. disable for unit tests.
    private $apiDirFS = null; // e.g. /var/www/www.mysite.com/api/
    private $apiRoot = null;  // URL-parent-folder of the API, e.g. /api
    private $routes = [ // all registered routes
        'GET' => [],
        'PUT' => [],
        'POST' => [],
        'DELETE' => [],
        'PATCH' => [],

        'CONNECT' => [],
        'HEAD' => [],
        'OPTIONS' => [],
        'TRACE' => [],
    ];

    public const UPLOAD_ERR = [
        0 => 'UPLOAD_ERR_OK',
        1 => 'UPLOAD_ERR_INI_SIZE',
        2 => 'UPLOAD_ERR_FORM_SIZE',
        3 => 'UPLOAD_ERR_PARTIAL',
        4 => 'UPLOAD_ERR_NO_FILE',
        6 => 'UPLOAD_ERR_NO_TMP_DIR',
        7 => 'UPLOAD_ERR_CANT_WRITE',
        8 => 'UPLOAD_ERR_EXTENSION',
    ];

    /**
     * Constructor.
     */
    public function __construct()
    {
        // autodetect our FS dir and our (sub)directory in the URL/path
        $scriptDir = dirname(__FILE__);
        $this->apiDirFS = $scriptDir . '/';
        $this->apiRoot = substr($scriptDir, strlen($_SERVER['DOCUMENT_ROOT']));
    }

    /**
     * Change API dir.
     *
     * Only to be used for debugging/unit testing.
     */
    public function debugApiDir(
        string $dir
    ) {
        $this->apiDirFS = $dir;
        $this->http = false;
    }

    /**
     * Get directory for API data.
     *
     * Might be used by derived classes to store API data (e.g. JSON). This is
     * the same directory this php file is in.
     *
     * @return string FS path to data dir, e.g. '/var/www/www.mysite.com/api/'
     */
    public function getDataDir(): string
    {
        $dir = $this->apiDirFS . 'data/';
        if (!is_dir($dir)) { // create dir on the fly
            if (!mkdir($dir, 0777, true)) {
                $this->sendError(500, 'can\'t create API data dir');
            }
        }
        return $dir;
    }

    /**
     * Get user-visible path (in URL) for the API.
     *
     * Usefull to detect a subdir installation on the client.
     *
     * @return string URI path to api, e.g. '/api/' or '/my/sub/folder/api'.
     */
    public function getAPIPath(): string
    {
        return $this->apiRoot;
    }

    // --- routing helpers -----------------------------------------------------

    /**
     * Register a route.
     *
     * Registered routes are available to route() calls later on.
     *
     * @param string $method An HTTP method.
     * @param string $route The route / path, e.g. '/users/:id/name'.
     * @param callable $handler The function to call when the route is hit.
     */
    public function register(
        string $method,
        string $route,
        callable $handler
    ): void {
        $this->routes[$method][$route] = $handler;
    }

    /**
     * Convert a route to a RegExp for easy checking.
     *
     * Will convert ':id' parts into named RegExp groups.
     *
     * @param string $route A route, e.g. '/users/:id/name'.
     * @return string RegExp, e.g. '/\/users\/(?'id'[^\/]+)/name'
     */
    private function routeToRegExp(
        string $route
    ): string {
        // replace backlashes
        $route = preg_replace('/\//', '\\/', $route);

        // replace group detection
        $route = preg_replace('/\/:([a-zA-Z]+)/', "/(?'$1'[^\/]+)", $route);

        // complete the regexp
        return '/^' . $route . '$/';
    }

    /**
     * Run the router.
     *
     * Requires prior registration of routes. Will call the first route that
     * matches the HTTP method and path (as of $_SERVER) or return a 404/405
     * error if no route exists.
     *
     * This method is not supposed to finish. Either a proper route should return
     * something to the client & exit, or route() will do that by sending an error.
     *
     * @param object $instance Instance to forward to the route.
     * @return mixed Data returned by the route. Usually only used by unit tests.
     */
    public function route(
        object $instance
    ) {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $this->sanitizePath(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

        // find a matching route
        foreach ($this->routes[$method] as $route => $handler) {
            if (preg_match($this->routeToRegExp($route), $path, $matches)) {
                if ($method === 'PATCH' || $method === 'PUT' || $method === 'POST') {
                    return $handler($instance, $matches, file_get_contents('php://input'));
                } else {
                    return $handler($instance, $matches); // don't parse incoming data on GET/DELETE
                }
                $this->sendError(500, 'oops, route failed'); // handler did not return anything
            }
        }

        // no route? too bad!
        switch ($method) {
            case 'GET':
                $this->sendError(404, 'not found: ' . $path);
                break;
            default:
                $this->sendError(405, 'method not allowed: ' . $path);
        }
    }

    // --- request helpers -----------------------------------------------------

    /**
     * Remove 'bad' stuff from a path so no one can break out of the docroot.
     *
     * @param string $path Path to sanitize.
     * @return string A path with invalid characters and '..' tricks, as well as
     *                the scriptfolder removed.
     */
    public function sanitizePath(
        string $path
    ): string {
        $path = urldecode($path);
        $path = preg_replace('/[^\w\s\d\-_~,;\/\[\]\(\)\.]/u', '', $path); // only whitelisted chars
        $path = preg_replace('/\.\.+/', '.', $path); // no '..'
        $path = preg_replace('/\/+/', '/', $path);   // reduce multiple slashes to one

        // remove (sub)dir name of php script
        return substr($path, strlen($this->apiRoot));
    }

    /**
     * Check/convert String JSON field against an array of values.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $value The value to check.
     * @param string[] $values Possible values as array.
     * @param bool $send Optonal. If true (default), validation erros are
     *                   as JSON. If false, null is returned instead.
     * @return mixed The matching item from the array.
     */
    public function assertEnum(
        string $field,
        $value,
        array $values,
        bool $send = true
    ) {
        if ($value !== null) {
            if (in_array($value, $values)) {
                if (is_numeric($value) === is_numeric($values[0])) { // extra check for PHP7
                    switch (gettype($values[0])) {
                        case 'integer':
                            return (int) $value;
                        case 'double':
                            return (double) $value;
                        case 'boolean':
                            return (bool) $value;
                        default:
                            return $value;
                    }
                }
            }
        }
        if ($send) {
            $this->sendError(400, "invalid JSON: $field invalid");
        } else {
            return null;
        }
    }

    /**
     * Check String JSON field against a RegExp.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $value The value to check.
     * @param string $pattern RegExp to check against. Excluding '/^' and '$/'.
     * @param bool $send Optonal. If true (default), validation erros are
     *                   as JSON. If false, null is returned instead.
     * @return string The parsed value.
     */
    public function assertString(
        string $field,
        $value,
        string $pattern,
        bool $send = true
    ) {
        if ($value !== null) {
            if (preg_match('/^' . $pattern . '$/', $value)) {
                return $value;
            }
        }
        if ($send) {
            $this->sendError(400, "invalid JSON: $field does not match $pattern");
        } else {
            return null;
        }
    }

    /**
     * Check/convert String JSON field to be a Semver string.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $value The value to check.
     * @param bool $send Optonal. If true (default), validation erros are
     *                   as JSON. If false, null is returned instead.
     * @return string The parsed value.
     */
    public function assertSemver(
        string $field,
        $value,
        bool $send = true
    ) {
        if ($value !== null && is_string($value)) {
            if (preg_match(JSONRestAPI::REGEXP_SEMVER, $value)) {
                return $value;
            }
        }
        if ($send) {
            $this->sendError(400, "invalid JSON: $field is not a Semver version string.");
        } else {
            return null;
        }
    }

    /**
     * Check/convert array-of-strings JSON field against a RegExp.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $values The value(s) to check.
     * @param string $pattern RegExp to check against. Excluding '/^' and '$/'.
     * @param int $minLength Minimum length of array. Defaults to 1.
     * @param int $maxLength Maximum length of array. Defaults to unlimited.
     * @param bool $send Optonal. If true (default), validation erros are
     *                   as JSON. If false, null is returned instead.
     * @return array The parsed strings as array.
     */
    public function assertStringArray(
        string $field,
        $values,
        string $pattern,
        int $minLength = 1,
        int $maxLength = PHP_INT_MAX,
        bool $send = true
    ) {
        if (!$this->assertArray($field, $values, $minLength, $maxLength, $send)) {
            return null;
        }
        $array = [];
        foreach ($values as $value) {
            $trimmed = trim($value);
            if (preg_match('/^' . $pattern . '$/', $trimmed)) {
                array_push($array, $trimmed);
            }
        }
        if (sizeof($array) === sizeof($values)) {
            return $array;
        }
        if ($send) {
            $this->sendError(400, "invalid JSON: $field entries do not match $pattern");
        } else {
            return null;
        }
    }

    /**
     * Check/convert if data is an object.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $values The value(s) to check.
     * @param bool $send Optonal. If true (default), validation erros are
     *                   as JSON. If false, null is returned instead.
     * @return object The parsed object.
     */
    public function assertObject(
        string $field,
        $values,
        bool $send = true
    ) {
        if ($values !== null && gettype($values) === 'object') {
            return $values;
        }
        if ($send) {
            $this->sendError(400, "invalid JSON: $field is not an object");
        } else {
            return null;
        }
    }

    /**
     * Check/convert if data is array.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $values The value(s) to check.
     * @param int $minLength Minimum length of array. Defaults to 1.
     * @param int $maxLength Maximum length of array. Defaults to unlimited.
     * @param bool $send Optonal. If true (default), validation erros are
     *                   as JSON. If false, null is returned instead.
     * @return array The parsed array.
     */
    public function assertArray(
        string $field,
        $values,
        int $minLength = 1,
        int $maxLength = PHP_INT_MAX,
        bool $send = true
    ) {
        if ($values !== null && gettype($values) === 'array') {
            if (sizeof($values) >= $minLength && sizeof($values) <= $maxLength) {
                return $values;
            }
        }
        if ($send) {
            $this->sendError(400, "invalid JSON: $field is not an array of length $minLength - $maxLength");
        } else {
            return null;
        }
    }

    /**
     * Check/convert if data is array of objects.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $values The value(s) to check.
     * @param int $minLength Minimum length of array.
     * @param bool $send Optonal. If true (default), validation erros are
     *                   as JSON. If false, null is returned instead.
     * @return array The parsed array.
     */
    public function assertObjectArray(
        string $field,
        $values,
        int $minLength = 0,
        int $maxLength = PHP_INT_MAX,
        bool $send = true
    ) {
        $objects = $this->assertArray($field, $values, $minLength, $maxLength, $send);
        foreach ($objects as $object) {
            if (gettype($object) !== 'object') {
                if ($send) {
                    $this->sendError(400, "invalid JSON: $field is not an array of (only) objects");
                } else {
                    return null;
                }
            }
        }
        return $objects;
    }

    /**
     * Check/convert Integer JSON field.
     *
     * Accepts any datatype that can be cast properly to an Integer. Will
     * check for min/max value.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $value The value to check.
     * @param int $min Minimum value. Defaults to 1.
     * @param int $max Maximum value. Defaults to 256.
     * @param bool $send Optonal. If true (default), validation erros are
     *                   as JSON. If false, null is returned instead.
     * @return int The parsed value.
     */
    public function assertInteger(
        string $field,
        $value,
        int $min = 1,
        int $max = 256,
        bool $send = true
    ) {
        if (is_numeric($value)) {
            $i = (int) $value;
            if ($i >= $min && $i <= $max) {
                return $i;
            }
        }
        if ($send) {
            $this->sendError(400, "invalid JSON: $field not between $min and $max");
        } else {
            return null;
        }
    }

    /**
     * Check/convert array-of-integers.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $values The value(s) to check.
     * @param int $min Minimum value. Defaults to 1.
     * @param int $max Maximum value. Defaults to 256.
     * @param int $minLength Minimum length of array.
     * @param int $maxLength Maximum length of array.
     * @param bool $send Optonal. If true (default), validation erros are
     *                   as JSON. If false, null is returned instead.
     * @return array The parsed strings as array.
     */
    public function assertIntegerArray(
        string $field,
        $values,
        int $min = 1,
        int $max = 256,
        int $minLength = 1,
        int $maxLength = PHP_INT_MAX,
        bool $send = true
    ) {
        if (!$this->assertArray($field, $values, $minLength, $maxLength, $send)) {
            return null;
        }
        $array = [];
        foreach ($values as $value) {
            $i = (int) $value;
            if (is_numeric($value) && $i >= $min && $i <= $max) {
                array_push($array, $i);
            }
        }
        if (sizeof($array) === sizeof($values)) {
            return $array;
        }
        if ($send) {
            $this->sendError(400, "invalid JSON: some $field entries are not integers $min - $max");
        } else {
            return null;
        }
    }

    /**
     * Check/convert Boolean JSON field.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $value The value to check.
     * @param bool $send Optonal. If true (default), validation erros are
     *                   as JSON. If false, null is returned instead.
     * @return bool The parsed value.
     */
    public function assertBoolean(
        string $field,
        $value,
        bool $send = true
    ): int {
        if ($value === true || $value === false) {
            return $value;
        }
        if ($send) {
            $this->sendError(400, "invalid JSON: $field not a boolean");
        } else {
            return null;
        }
    }

    /**
     * Check Base64 JSON field.
     *
     * Accepts any datatype that can be cast properly to a string.
     *
     * To be used on fields send by the client. Will send an 400-error to the
     * client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param mixed $value The value to check.
     * @param bool $send Optonal. If true (default), validation erros are
     *                   as JSON. If false, null is returned instead.
     * @return int The parsed value.
     */
    public function assertBase64(
        string $field,
        $value,
        bool $send = true
    ): string {
        if (base64_encode(base64_decode($value, true)) === $value) {
            return $value;
        }
        if ($send) {
            $this->sendError(400, "invalid JSON: $field not valid base64-encoded data.");
        } else {
            return null;
        }
    }

    /**
     * Check if an object has a set of fields.
     *
     * @param string $field Field name for error message.
     * @param mixed $value The value to check.
     * @param string[] $properties Properties to find in object.
     * @param bool $send Optonal. If true (default), validation erros are
     *                   as JSON. If false, null is returned instead.
     * @return int The parsed item.
     */
    public function assertHasProperties(
        string $field,
        $value,
        $properties,
        bool $send = true
    ): object {
        if ($value !== null && gettype($value) === 'object') {
            foreach ($properties as $property) {
                if (!\property_exists($value, $property)) {
                    if ($send) {
                        $this->sendError(400, 'invalid JSON: ' . $property . ' missing');
                    } else {
                        return null;
                    }
                }
            }
        } else {
            if ($send) {
                $this->sendError(400, "invalid JSON: $field invalid " . gettype($value));
            } else {
                return null;
            }
        }
        return $value;
    }

    // --- payload helpers -----------------------------------------------------

    /**
     * Convert incoming payload from form-data to JSON.
     *
     * @return object Incoming data JSON string if successfull, or null
     *                if request was not 'multipart/form-data'.
     */
    public function multipartToJSON()
    {
        foreach ($_SERVER as $header => $headerValue) {
            if (preg_match('/^content.type$/i', $header) && substr($headerValue, 0, 19) === 'multipart/form-data') {
                $payload = [];

                foreach ($_POST as $key => $value) {
                    $payload[$key] = $value;
                }
                if (count($_FILES) > 0) {
                    $payload['_files'] = array_keys($_FILES);
                }

                return json_encode($payload);
            }
        }
        return null;
    }

    /**
     * Assert that user-data is in JSON format.
     *
     * To be used on JSON provided by the client to check for syntax errors. Will
     * send an 400-error to the client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param string $data User-provided data/string.
     * @return object Parsed JSON data if successfull.
     */
    public function assertJSON(
        string $field,
        ?string $data
    ) {
        $decoded = json_decode($data);
        if ($decoded === null) {
            $this->sendError(400, $field . ' is not valid JSON');
        }
        return $decoded;
    }

    /**
     * Assert that user-data is in JSON format and an object.
     *
     * To be used on JSON provided by the client to check for syntax errors. Will
     * send an 400-error to the client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param string $data User-provided data/string.
     * @return object Parsed JSON data if successfull.
     */
    public function assertJSONObject(
        string $field,
        ?string $data
    ): object {
        $decoded = $this->assertJSON($field, $data);
        return $this->assertObject($field, $decoded);
    }

    /**
     * Assert that user-data is in JSON format and an array.
     *
     * To be used on JSON provided by the client to check for syntax errors. Will
     * send an 400-error to the client and terminate further execution if invalid.
     *
     * @param string $field Field name for error message.
     * @param string $data User-provided data/string.
     * @return object Parsed JSON data if successfull.
     */
    public function assertJSONArray(
        string $field,
        ?string $data
    ): array {
        $decoded = $this->assertJSON($field, $data);
        return $this->assertObjectArray($field, $decoded);
    }

    /**
     * Send an JSON error to the client.
     *
     * Will wrap the error in a simple JSON error object:
     *
     * '{ "error": "<message>" }'
     *
     * Will also terminate execution after sending.
     *
     * @param int $cod Statuscode to send. Defaults to 200.
     * @param string $mainMessage A primary error message.
     * @param string $appErrorcode An error code for the webapp to react upon,
     *                             e.g. 'ZIP_INVALID'.
     * @param array $otherMessages An optional array of strings of more,
     *                             detailes messages.
     * @return void
     */
    public function sendError(
        int $code,
        string $mainMessage,
        string $appErrorCode = 'GENERIC_ERROR',
        array $otherMessages = []
    ): void {
        $errors = [$mainMessage];
        foreach ($otherMessages as $message) {
            $errors[] = $message;
        }
        $error = '{"_error": "' . $appErrorCode . '","_messages":' . json_encode($errors) . '}';
        $this->sendReply($code, $error);
    }

    /**
     * Send a HTTP reply to the client.
     *
     * Will terminate execution after sending.
     *
     * @param int $cod Statuscode to send. Defaults to 200.
     * @param string $body Response body. Defaults to ''.
     * @param string $location Optional URL for a 'Location:' header.
     * @return void
     */
    public function sendReply(
        int $code = 200,
        ?string $body = '',
        string $location = null,
        string $digest = null
    ): void {
        if ($this->http) { // regular mode uses HTTP replies
            http_response_code($code);
            header('Servertime: ' . time());
            if ($location) {
                header('Location: ' . $location);
            }
            if ($digest) {
                header('Digest: ' . $digest);
            }
            if ($body !== null) {
                echo $body;
            }
            die;
        } else { // during tests we want to capture errors as exceptions
            throw new \Exception($body, $code);
        }
    }

    // --- file locking --------------------------------------------------------

    // Locking functions are not needed by JSONRestAPI. They are provided for
    // convenience, as classes deriving from JSONRestAPI often want to lock
    // stuff.

    /**
     * Obain an exclusive file lock for writing.
     *
     * If no LOCK_EX lock can be obtained, a JSON error is sent to the client.
     *
     * @param string $lockFile Optional path to lock file. Defaults to <datadir>/.flock
     */
    public function waitForWriteLock(
        ?string $lockFile
    ) {
        $lockFile = $lockFile ?? $this->getDataDir() . '.flock';

        $lock = fopen($lockFile, 'w');
        if (flock($lock, LOCK_EX)) {  // acquire an exclusive lock
            return $lock;
        } else {
            $this->sendError(423, 'can\'t lock ' + $lockFile + ' for writing');
        }
    }

    /**
     * Obain a shared file lock for reading.
     *
     * If no LOCK_SH lock can be obtained, a JSON error is sent to the client.
     *
     * @param string $lockFile Optional path to lock file. Defaults to <datadir>/.flock
     */
    public function waitForReadLock(
        ?string $lockFile
    ) {
        $lockFile = $lockFile ?? $this->getDataDir() . '.flock';

        $lock = fopen($lockFile, 'w');
        if (flock($lock, LOCK_SH)) {  // acquire a shared lock
            return $lock;
        } else {
            $this->sendError(423, 'can\'t lock ' . $lockFile . ' for reading');
        }
    }

    /**
     * Unlock a lock obtained by waitForReadLock() or waitForWriteLock().
     *
     * @param $lock The lock to release.
     */
    public function unlockLock(
        $lock
    ) {
        flock($lock, LOCK_UN);
    }

    /**
     * Read a file using a shared lock.
     *
     * Calls waitForReadLock - see there for more infos.
     *
     * @param string $path Path to file to read.
     * @param string $lockFile Optional path to lock file. Defaults to <datadir>/.flock
     * @return string The file's content.
     */
    public function fileGetContentsLocked(
        string $path,
        ?string $lockFile
    ): string {
        $lock = $this->waitForReadLock($lockFile);
        $content = file_get_contents($path);
        $this->unlockLock($lock);
        return $content;
    }

    /**
     * (Over)Write a file using an exclusive lock.
     *
     * Calls waitForWriteLock - see there for more infos.
     *
     * @param string $path Path to file to write.
     * @param string $content Content to write into file (replaces old content).
     * @param string $lockFile Optional path to lock file. Defaults to <datadir>/.flock
     * @return string The file's content.
     */
    public function filePutContentsLocked(
        string $path,
        string $content,
        ?string $lockFile
    ) {
        $lock = $this->waitForReadLock($lockFile);
        file_put_contents($path, $content);
        $this->unlockLock($lock);
    }

    // --- other helpers -------------------------------------------------------

    // Again, not needed by JSONRestAPI, but very handy in derived classes.

    /**
     * Create a v4 UUID.
     *
     * @param string $seed Optional seed for randomness in UUID.
     * @return string A UUID, e.g. '8b8deba5-640b-4388-a2cc-3a4c56af9fb8'.
     */
    public static function uuid(
        string $seed = null
    ): string {
        $data = $seed ?? random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * Make sure a JSON file exists by touching it with a default content.
     *
     * @param string $path Full path to file.
     * @param string $content Content to write in file if it does not exist.
     * @return object Loaded & parsed JSON (Object or Array).
     */
    public static function touchAndReadJSON(
        string $path,
        string $content = '{}'
    ) {
        if (is_file($path)) {
            touch($path);
        } else {
            file_put_contents($path, $content);
        }
        return json_decode(file_get_contents($path));
    }

    /**
     * Create a random ID.
     *
     * @param string $seed Optional seed for randomness.
     * @return string 16-digit hex string, e.g. 'a2cc3a4c56af9fb8'.
     */
    public static function id(
        string $seed = null
    ): string {
        if ($seed) {
            $data = substr($seed . '1234567890', 0, 8);
        } else {
            $data = random_bytes(8);
        }
        return bin2hex($data);
    }

    /**
     * Generate a compact ID.
     *
     * @param int $seed Optional seed for predictable randomness.
     * @return string 8-digit base-64 string, e.g. 'a2-Jc5Xe'.
     */
    public static function id64(
        int $seed = null
    ): string {
        $digits = '0123456789'
            . 'abcdefghijklmnopqrstuvwxyz-'
            . 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'; // 64 digits
        $id = [];
        if ($seed) {
            for ($i = 0; $i < 8; $i++) {
                $id[] = $digits[($seed >> ($i * 6)) % 64];
            }
        } else {
            $data = random_bytes(8);
            for ($i = 0; $i < 8; $i++) {
                $id[] = $digits[ord($data[$i]) % 64];
            }
        }
        return implode($id);
    }

    /**
     * Determine if a SemVer 2 version string satisfies a target string.
     *
     * This does not cover all the edge cases, but is good enough for us.
     * Supports single targets ('^', '~', '>', '>=', '<', '<=' and '=' a.k.a.
     * ''), but no ranges or combined targets.
     *
     * @param string $version Version to check, e.g. '1.2.3-rc.2'.
     * @param string $target A version target to check against, e.g. '~1.2.3'.
     * @return bool True if version satisifes the target. False otherwise.
     */
    public static function semverSatisfies(
        string $version,
        string $target
    ): bool {
        // split both items
        if (
            !preg_match(JSONRestAPI::REGEXP_SEMVER, $version, $vParts)
            || !preg_match(JSONRestAPI::REGEXP_SEMVER, $target, $rParts)
        ) {
            // invalid stuff never satisfies
            return false;
        }
        $vParts['major'] = array_key_exists('major', $vParts) ? $vParts['major'] : '0';
        $vParts['minor'] = array_key_exists('minor', $vParts) ? $vParts['minor'] : '0';
        $vParts['patch'] = array_key_exists('patch', $vParts) ? $vParts['patch'] : '0';
        $vParts['prerelease'] = array_key_exists('prerelease', $vParts) ? $vParts['prerelease'] : '~';
        $rParts['major'] = array_key_exists('major', $rParts) ? $rParts['major'] : '0';
        $rParts['minor'] = array_key_exists('minor', $rParts) ? $rParts['minor'] : '0';
        $rParts['patch'] = array_key_exists('patch', $rParts) ? $rParts['patch'] : '0';
        $rParts['prerelease'] = array_key_exists('prerelease', $rParts) ? $rParts['prerelease'] : '~';

        // prepare string-compareable version of both items
        $strVersion = sprintf(
            '%08d%08d%08d',
            $vParts['major'],
            $vParts['minor'],
            $vParts['patch']
        ) . $vParts['prerelease'];
        $strTarget = sprintf(
            '%08d%08d%08d',
            $rParts['major'],
            $rParts['minor'],
            $rParts['patch']
        ) . $rParts['prerelease'];

        // compare necessary parts depending on operator
        switch ($rParts['operator']) {
            case '^':
                return
                    $vParts['major'] === $rParts['major']
                    && strcmp(substr($strVersion, 8), substr($strTarget, 8)) >= 0;
            case '~':
                return
                    $vParts['major'] === $rParts['major']
                    && $vParts['minor'] === $rParts['minor']
                    && strcmp(substr($strVersion, 16), substr($strTarget, 16)) >= 0;
            case '>':
                return strcmp($strVersion, $strTarget) > 0;
            case '>=':
                return strcmp($strVersion, $strTarget) >= 0;
            case '<':
                return strcmp($strVersion, $strTarget) < 0;
            case '<=':
                return strcmp($strVersion, $strTarget) <= 0;
            case '=':
            case '':
                return $strVersion === $strTarget;
        }

        return false; // unknown operator never satisfies
    }

    /**
     * Delete a directory recursively.
     *
     * As sanity precaution it will only operate on directories blow the API.
     * Will silently fail if the dir is relative our outside the API dir.
     *
     * @param string $path Absolute path to directory.
     */
    public function deleteDir(
        string $path
    ) {
        $dataDir = $this->getDataDir();
        if (substr($path . '/', 0, strlen($dataDir)) === $dataDir) { // sanity check
            if (is_dir($path)) {
                foreach (scandir($path) as $file) {
                    if (is_dir($path . '/' . $file)) {
                        if ($file !== '.' && $file !== '..') {
                            self::deleteDir($path . '/' . $file);
                        }
                    } else {
                        @unlink($path . '/' . $file);
                    }
                }
                rmdir($path);
            }
        }
    }
}
