# Setup

This guide covers the installation of FreeBeeGee.

## Requirements

### Server

* PHP 7.2+
* Apache with `.htaccess` / `mod_rewrite` support

### Client

Any recent HTML5-capable browser should do. No IE, sorry. Mobile/touch device support is also a bit limited for now.

## Installation

If the server requirements are met, installation is as simple as:

* Download the latest `*.tar.gz`/`*.zip` from [https://github.com/ludus-leonis/FreeBeeGee/releases](https://github.com/ludus-leonis/FreeBeeGee/releases).
* Extract the `*.tar.gz`/`*.zip` into a folder on your web-server.

You can pick the root folder of your server, or create a subfolder for FreeBeeGee.

Per default, FreeBeeGee comes with a simple `.htaccess` file with the same content as `.htaccess_basic`. This only contains a few, mandatory server settings. A better, more secure `.htaccess_full` is also provided, but depending on your web server / Apache version, the full version might break. It is recommended that you try to copy `.htaccess_full` over `.htaccess` and revert to the basic file if you get in trouble.

`.htaccess_full` also contains rules how to enforce https and to supress 'www.', but they are disabled by default. Enable them if needed.

Finally, review the `terms.html` and don't forget to update your GDPR / privacy statement in `privacy.html`. Consider neither of them as legal advice - if in doubt, consult a lawyer.

## Configuration

The server config file is found in `api/data/server.json`:

```
{
  "ttl": 48,                // hours of inactivity after a table gets deleted
  "maxTables": 128,          // maximum concurrent tables allowed
  "maxTableSizeMB": 4,       // maximum size per table folder / snapshot / template
  "snapshotUploads": false, // set to true to enable snapshot upload on table create
  "passwordCreate": "................."
}
```

### Passwords

`passwordCreate` currently contains a single, bcrypt hashed password. It will be required to create but not to join tables. Set it to an empty string (`""`) for no password. You can generate a password hash using any bcrypt tool you like, for example the `htpasswd` command that comes with Apache:

```
htpasswd -bnBC 12 "" "mysupersecretpassword!!!11" | tr -d ':\n'
```

FreeBeeGee ships with an unkown password. No tables can be created until you either set one or explicitly disable it.

### Uploads

Snapshot uploads are disabled by default. To enable them, set `snapshotUploads` to `true`.

You can change the maximum upload file size via the `server.json` (see above). You also have to make sure that your PHP config file (`php.ini`) and/or your Apache/Proxy server settings allow that amount, too.

## Upgrading

While FreeBeeGee is still a Zero-version (v0.x), no upgrade docs are provided. Internal things might change at any time, even tables will break between versions. Start with a fresh install till we reach v1.0.

## Build from source

This is not needed for a regular installation. Most users should be fine with the the pre-packaged `*.tar.gz`/`*.zip` mentioned above.

However, if you want to build FreeBeeGee yourself, you'll need `git`, `php` v7.2+, `npm` v6.5+ and `gulp` v4 locally installed. Then do:

```
git clone --depth 1 https://github.com/ludus-leonis/FreeBeeGee
cd FreeBeeGee
npm install
gulp release
```

The archives can now be found in the `dist/` folder.
