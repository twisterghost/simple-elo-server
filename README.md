# Simple Elo Server

Displays the computed elo of players given a list of player and a list of game outcomes.

## Setup

```shell
$ git clone ...
$ npm i
```

Then, populate two json files:

**players.json** which contains a JSON array of unique player names as strings:

```json
[
  "someone",
  "someoneElse"
]
```

> **Note**: These are used as object keys in JS and therefore must be valid object keys

**games.json** which contains a JSON array of outcomes, following the format:

```json
[
  {
    "winningPlayer": 1,
    "losingPlayer": 2
  }
  ...
]
```

## Run

`npm start`
