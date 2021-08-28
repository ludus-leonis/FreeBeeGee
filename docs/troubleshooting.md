# Troubleshooting

Here are a few common problems and possible solutions:

## I don't know the password to create rooms.

See the [install instructions](INSTALL.md). You need to set a password first (or disable it).

## Our server is currently experiencing technical difficulties.

This is a bit tricky to diagnose as it can different reasons. Doublecheck if you have all required Apache and PHP modules/extensions installed that are listed in the [install instructions](INSTALL.md).

Here are a few things you can try:

* Take a look into your web server's `error.log`. The server might complain about missing extensions/modules. If so, you need to install those.
* Open the browser console (press F12) and switch to the Network tab. There sould be a line that says `/api`. Select it and view the server response/reply (raw/source). There might be errors about missing extensions/modules hidden there.

## I can't upload a snapshot (that I downloaded from the same server)

There are two main reasons for that:

* You updated FreeBeeGee in the mean time. While still a version zero (v0.*), snapshots are not guaranteed to work with newer versions.
* Your Snapshot has become larger than the server upload limit. See the [install instructions](INSTALL.md) how to increase that limit.

If the snapshot is custom made or from another server, your best bet is to open the browser console (F12) and check for errors during upload. You might discover missing or invalid files that way.
