# FreeBeeGee API

This document is part of the [FreeBeeGee documentation](DOCS.md). It describes the FreeBeeGee (FBG) API endpoints.

It is not necessary to read/understand this to use FBG. This information is here for developers who would like to contribute code or extend FBG.

## Basics

The FreeBeeGee API is a JSON/REST API and can be called at `./api/` relative to the installation directory. It understands HTTP `GET`, `POST`, `PUT`, `PATCH` and `DELETE` requests. Most endpoints return FBG data objects as described in the [datamodel documentation](datamodel.md).

Too keeps things short, the documentation below will mention endpoints relative to said `./api/`. So if e.g. the docs say to `GET` endpoint `/rooms/`, assume the actual URL is:

```
https://your-server.example.org/path/too/fbg/api/rooms/
```

## Authentication

Endpoints outside the `/rooms/` folder do not require authentication.

Almost all endpoints inside the `/rooms/` require an `Authorization:` header to be present if the room has a password set, otherwise they will return `401`. To *login* to a room, first `POST` the following JSON to `/rooms/..id../auth/` - the only endpoint in the room folder that does not require that header:

```json
{
  "password": "my-supersecret-password"
}
```

If the passwords is correct, the API will respond with `200` and the following JSON:

```json
{
  "token": "a22fcc13-7a7a-49d1-aaa1-b62d8b732016"
}
```

All other room endpoints for the same room ID will require that token, sent as `Authorization` header in the HTTP request:

```
Authorization: a22fcc13-7a7a-49d1-aaa1-b62d8b732016
```

Since FBG does not know of individual users, the token is per-room.

There is one *special* token: `00000000-0000-0000-0000-000000000000`. Rooms without password will always return this token in the `/rooms/..id../auth/` call. It does not matter if the client sends this zero-token or no token at all to password-less endpoints.

## Endpoints

TBD.
