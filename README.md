# Simple Elo Server

Displays the computed elo of players given a list of players and a list of game outcomes.

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
  // Completed Game
  {
    players: ["someone", "somoneElse"],
    startDate: "1/1/2019",
    endDate: "1/2/2019",
    winner: "someoneElse"
  },
  // Active Game
  {
    players: ["somebody", "somebodyElse"],
    startDate: "1/1/2019"
  }
  ...
]
```

## Run

`npm start`

It will serve on port 3000 using [micro](https://github.com/zeit/micro)
