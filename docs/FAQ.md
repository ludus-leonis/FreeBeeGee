# FAQ (technical)

This document is part of the [FreeBeeGee documentation](DOCS.md). It hopes to give insights into FreeBeeGee's design goals and technical decisions. tldr:

* **Easy is king.** FreeBeeGee should be very, very easy to install.
* **Distributed is king.** We prefer a lot of people running small installations over a few mega-servers.

## Wouldn't &lt;your-favorite-language&gt; be better for implementing the API?

Probably. I won't defend PHP as a language here. But it has one big advantage over other technology stacks: For the average gamer/blogger without technical background, PHP software is very easy and cheap to get hosted. Due the popularity of WordPress, Typo3 and co., there are zillions PHP-hosters out there that provide managed, zero-config webspace for a few bucks. Those webspaces often do not provide shell/root access, only a docroot to drop files into.

FreeBeeGee uses PHP only for the faceless JSON/Rest API and won't let it go anywhere near the frontend stuff. In the future, it might be possible for this project to provide alternative implementations. Maybe even in &lt;your-favorite-language&gt;.

## Wouldn't websockets/pushing be better than polling?

Yes, it would. But this is a compromise in favor of another design goal. PHP can do websockets, but most managed PHP-hosters won't allow running your own processes or listening on ports.

We optimized the polling with auto-adapting intervals depending on what's going on in each game. This mechansim should be fine for running a few games simultaneously on even a small, shared PHP server. And we have this Distributed-is-king policy, so instead of optimizing one installation to serve thousands, why not just run it 10x?

## No Database?

A database would be better in some cases, yes, but mind the Easy-is-King rule. No database means fewer requirements and less work for the owner of the server. It also makes backups easier.

Most of the data processing is done by the clients, in JavaScript. The server mostly delivers stored, pre-generated JSON files. We don't have to query data or merge stuff on the server side a lot. In the few cases we do, users can wait the extra 100ms.

## What about concurrent data access?

Each game is an isolated folder on the server. The vast majority of requests to the API are read-requests for static JSON files. Rare write-requests that change those files peak at ~1 request per second per game in typical games. That's when players are shifting pieces on the board. We are fine with simple file-based locking in combination with one lock file per running game.
