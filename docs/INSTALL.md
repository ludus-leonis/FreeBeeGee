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

If you are using [Docker](https://en.wikipedia.org/wiki/Docker_(software)) on your server, you can also install & run FreeBeeGee as a container. It comes with a pre-configured Apache webserver and PHP 8.2.

```
FBGPASS=supersecret docker run -d -e FBGPASS -p 8765:80 ghcr.io/ludus-leonis/freebeegee:latest
```

Please, please pick a better password (!). FreeBeeGee should be running now at `http://localhost:8765/`.

Usually you'll want to persist room data, in that case mount a volume for `/var/www/html/api/data`:

```
docker run -d -p 8765:80 -v /home/username/fbg-data:/var/www/html/api/data ghcr.io/ludus-leonis/freebeegee:latest
```

FreeBeeGee will then recreate all necessary files in this volume including a default `server.json`. You'll have to set your admin password there manually. Edits in your config file will be effective with the next page reload, no container restart necessary.


## Configuration

FreeBeeGee stores all non-static data in `api/data/`, including config files and directories for rooms and other content. The directory is empty until you first open FreeBeeGee in your browser.

Launch FreeBeeGee in your browser. You'll be greeted by a setup page telling you to set an admin password, and the server should have create a default config file in `api/data/server.json`:

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

There is also a `system/server.json.example` template file if you want to compare an existing configuration with the original after you updated FreeBeeGee.

### Admin passwords

`passwordCreate` contains a single, bcrypt hashed password. It will be required to create but not to join rooms. FreeBeeGee ships with an unknown admin password. No rooms can be created until you either set one or explicitly disable it.

You can generate a password (hash) using any bcrypt tool you like. You can use the tool found on the `/tools` page after you installed FreeBeeGee. Another option is the `htpasswd` command that comes with Apache:

```
htpasswd -bnBC 12 "" "mysupersecretpassword!!!11" | tr -d ':\n'
```

To disable passwords, you can also set `passwordCreate` to an empty string (`""`).

### Uploads

Snapshot (savegame) uploads are disabled by default. To enable them, set `snapshotUploads` to `true`.

You can change the maximum upload file size via the `server.json` (see above). You also have to make sure that your PHP config file (`php.ini`) and/or your Apache/Proxy server settings allow that amount, too.

## Backups

FreeBeeGee will keep all dynamic data in `.../api/data/`. Backup this folder to keep your game data and configurations safe.

## Upgrading

While FreeBeeGee is still a Zero-version (v0.x), no upgrade paths are provided. However, you can usually switch to a newer version by extracting the new `.zip`/`.tar.gz` over your existing installation, or moving the `.../api/data` directory from an old to a new installation. You might still want to check the *Configuration* section above - maybe cool new `server.json` options are now available.

FreeBeeGee will try to auto-upgrade older rooms when they are first opened. This usually works fine, but sometimes internal things change and you might loose pieces. If the [Release notes](https://github.com/ludus-leonis/FreeBeeGee/releases) of a particular version mentions BREAKING CHANGES, the risk of loosing pieces / parts of your tables are higher. You have been warned.
