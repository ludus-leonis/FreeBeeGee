# Troubleshooting

Here are a few common problems and possible solutions:

## I get an 'Internal Server Error' page.

If you get this with the basic, default `.htaccess` file provided in the .zip file right after installation: Apache's module `mod_rewrite` is not enabled on your httpd server - either not in general or not for your domain. How to enable it depends a bit on your configuration, so please check your server configuration file or the web admin tool of your provider.

If you get this after editing the `.htaccess` file yourself: There is a syntax error or you are trying to use an Apache module currently not enabled on the server. Please check your changes.

## Our server is currently experiencing technical difficulties.

This is a bit tricky to diagnose as it can different reasons. Doublecheck if you have all required Apache and PHP modules/extensions installed that are listed in the [install instructions](INSTALL.md).

Here are a few things you can try:

* Take a look into your web server's `error.log`. The server might complain about missing extensions/modules. If so, you need to install those.
* Open the browser console (press F12) and switch to the Network tab. There sould be a line that says `/api`. Select it and view the server response/reply (raw/source). There might be errors about missing extensions/modules hidden there.

## I don't know the password to create rooms.

See the [install instructions](INSTALL.md). You have to set a password first (or disable it).

## FreeBeeGee rejects snapshot uploads as too large.

This can have multiple reasons. Hover on the (?) icon of the error message to find out why.

* Your webserver might limit upload sizes. Check your httpd.conf. Managed web hosters might also have an option for that in their web console.
* PHP might limit uploads. Check your php.ini. Managed web hosters might also have an option for that in their web console.
* FreeBeeGee might limit uploads. Check your `api/data/server.json` to increase the limit.

## FreeBeeGee is missing stuff or showing strange boxes after converting a snapshot.

This can't be avoided when uploading older snapshots that use features that changed or were removed. Most of the time your library should be fine, but pices on the table might be missing. The boxes are a hint for you what is missing. Remove them and add the pices again, or empty the table and start from scratch.
