# Simple Elo Server

Displays the computed elo of players given a list of players and a list of game outcomes.

## Setup

```shell
$ git clone ...
$ npm i
```

## Run

`npm start`

It will serve on port 3000 using [micro](https://github.com/zeit/micro)

## Endpoints

* `/`
  * View Elo rankings
* `/addPlayer`
  * Add a player to the system
* `/addResult`
  * Add a game result to the system

## Developing

You can use the `npm run dev` script to leverage `micro-dev` when hacking on the server.

To lint, run `npm run lint`

This project uses the AirBnb styleguide
