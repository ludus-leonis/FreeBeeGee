# Setup

This document is part of the [FreeBeeGee documentation](DOCS.md). It covers the basic installation of FreeBeeGee.

See the [Troubleshooting](troubleshooting.md) instructions for additional help.

## Requirements

### Server

* PHP 7.4 / 8.0 / 8.1 / 8.2 / 8.3
  * required extensions: `zip`
* Apache
  * required: `.htaccess`, `mod_rewrite`
  * recommended: `mod_headers`, `mod_expires`, `mod_deflate`

Configuring your web-server & enabling the required extension/modules is beyond the scope of this guide. Please refer to your server/provider documentation how to do so.

If the requirements are not met, FreeBeeGee will try to find out what is missing and tell you on the landing page.

### Client

Any recent HTML5-capable browser should do. Mobile/touch device support is also a bit limited for now.


## Basic installation

If the server requirements are met, installation is as simple as:

* Download the latest `*.tar.gz`/`*.zip` from [https://github.com/ludus-leonis/FreeBeeGee/releases](https://github.com/ludus-leonis/FreeBeeGee/releases).
* Extract the `*.tar.gz`/`*.zip` into a folder on your web-server.
* Make sure FreeBeeGee / the web server has write permissions in the `api/data/` folder.

You can pick the root folder of your server, or create a subfolder for FreeBeeGee.

Per default, FreeBeeGee comes with a simple `.htaccess` file with the same content as `.htaccess_basic`. This only contains a few, mandatory server settings. A better, more secure `.htaccess_full` is also provided, but depending on your web server / Apache version, the full version might break. It is recommended that you try to copy `.htaccess_full` over `.htaccess` and revert to the basic file if you get in trouble.

`.htaccess_full` also contains rules how to enforce https and to supress 'www.', but they are disabled by default. Enable them if needed.

Finally, review the `terms.html` and don't forget to update your GDPR / privacy statement in `privacy.html`. Consider neither of them as legal advice - if in doubt, consult a lawyer.


## Alternate installation - Docker

If you are using [Docker](https://en.wikipedia.org/wiki/Docker_(software)) on your server, you can also install & run FreeBeeGee as a container. It comes with a pre-configured Apache webserver and PHP.

```
FBGPASS=supersecret docker run -d -e FBGPASS -p 8765:80 ghcr.io/ludus-leonis/freebeegee:latest
```

Please, please pick a better password (!).

FreeBeeGee should be running now at `http://localhost:8765/`. If you want to persist room data, mount a volume for `/var/www/html/api/data/rooms`. To edit the config file, mount a local file as `/var/www/html/api/data/server.json` or copy the file out, edit and copy back in:

```
docker cp <containername>:/var/www/html/api/data/server.json /tmp/server.json
... edit /tmp/server.json ...
docker cp /tmp/server.json <containername>:/var/www/html/api/data/server.json
```

The new config file will be effective with the next page reload, no container restart necessary.

As an alternative method, you can also mount a single volume for the whole `/var/www/html/api/data`. In that case make sure it is pre-populated with the content found in `FreeBeeGee/api/data` of a FreeBeeGee `*.tar.gz`/`*.zip` release.

## Configuration

FreeBeeGee stores all non-static data in `api/data/`, where it expects its config files and will create directories for rooms and other content.

The server config file is found in `api/data/server.json`:

```
{
  "ttl": 48,                     // hours of inactivity after a room gets deleted
  "maxRooms": 32,                // maximum concurrent rooms allowed
  "maxRoomSizeMB": 16,           // maximum size per room folder / snapshot
  "defaultSnapshot": "Tutorial", // will be pre-selected in the create-room dialog
  "snapshotUploads": false,      // set to true to enable snapshot upload on room create
  "passwordCreate": "................."
}
```

### Admin passwords

`passwordCreate` currently contains a single, bcrypt hashed password. It will be required to create but not to join rooms. Set it to an empty string (`""`) for no password.

You can generate a password hash using any bcrypt tool you like. You can use the tool found on the `/tools` page after you installed FreeBeeGee. Another option is the `htpasswd` command that comes with Apache:

```
htpasswd -bnBC 12 "" "mysupersecretpassword!!!11" | tr -d ':\n'
```

FreeBeeGee ships with an unknown admin password. No rooms can be created until you either set one or explicitly disable it.

### Uploads

Snapshot (savegame) uploads are disabled by default. To enable them, set `snapshotUploads` to `true`.

You can change the maximum upload file size via the `server.json` (see above). You also have to make sure that your PHP config file (`php.ini`) and/or your Apache/Proxy server settings allow that amount, too.

## Upgrading

While FreeBeeGee is still a Zero-version (v0.x), no upgrade docs are provided. Internal things might change at any time, even rooms will break between versions. Download rooms you want to keep as snapshots, do a fresh install and recreate the rooms from the snapshots till we reach v1.0. FreeBeeGee tries to auto-upgrade snapshots if possible.
