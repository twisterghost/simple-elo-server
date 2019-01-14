const fs = require('fs');
const _ = require('lodash');
const { send } = require('micro');
const parse = require('urlencoded-body-parser');
const { router, get, post } = require('microrouter');
const EloRank = require('elo-rank');
const elo = new EloRank(25);
const DEFAULT_ELO = 1000;
const moment = require('moment');

const DATE_FORMAT = 'M/D/YYYY';
const NAME_REGEX = /^[a-zA-Z][a-zA-Z_]{1,29}$/;

// players.json is a json array of strings representing unique player names
// games.json is an array of tuple objects representing completed and active games
// with an array of player-ids representing participating players, start + end dates
// and a "winner" field to indicate the id of the winner
/* ...
 * {
 *   "players": ["someone", "someoneElse"],
 *   "startDate": "1/1/19",
 *   "endDate": "1/2/19",
 *   "winner": "someone"
 * }
 * ...
 */

// Load in the files at startup
let playerList = [];
try {
  const playerListFile = fs.readFileSync('./players.json', 'utf8');
  playerList = JSON.parse(playerListFile);
} catch (error) {
  console.info('Using default player data');
}

let gameList = [];
try {
  const gameListFile = fs.readFileSync('./games.json', 'utf8');
  gameList = JSON.parse(gameListFile);
} catch (error) {
  console.info('Using default game list data');
}

/**
 * Saves the data to local files
 */
function save() {
  console.info('Saving data files...');
  fs.writeFileSync('./games.json', JSON.stringify(gameList), 'utf8');
  fs.writeFileSync('./players.json', JSON.stringify(playerList), 'utf8');
}

/**
 * Calculates elo ranks from scratch using the current data
 * @returns {object} key-value pairs of player names to elo rank
 */
function calculate() {

  const rankings = {}
  playerList.forEach(player => {
    rankings[player] = DEFAULT_ELO;
  });

  // Extract all the completed games
  const finishedGames = gameList.filter(game => {
    return !!(game.winner && game.endDate);
  });
  // Sort by date the game ended
  finishedGames.sort((a, b) => {
    return (+moment(a.endDate, DATE_FORMAT)) - (+moment(b.endDate, DATE_FORMAT));
  });

  // Loop through completed games to update rankings
  finishedGames.forEach(game => {
    // Loop through each player in the game
    game.players.forEach((player, idx) => {
      // TODO: If we support more than 2 players in a game, then we'll need to update this logic, but elo should support it
      const otherIdx = 1 - idx; // Trick to get the opposite index of the current one (1 -> 0 | 0 -> 1)
      const otherPlayer = game.players[otherIdx];
      const prevRating = rankings[player];
      const expectedScore = elo.getExpected(prevRating, rankings[otherPlayer]);
      const actualScore = (game.winner === player) ? 1 : 0;
      rankings[player] = elo.updateRating(expectedScore, actualScore, prevRating);
    });
  });

  return rankings;
}

/**
 * Given an object of elo rankings, get a list rank objects ordered by rank
 * @param rankings {object} Rankings object as created by `calculate()`
 * @returns {orderedRanks} A list of objects containing player name and elo in order of elo
 */
function asOrderedTuples(rankings) {
  const asTuples = Object.keys(rankings).map(player => ({player, elo: rankings[player]}));
  return asTuples.sort((a, b) => b.elo - a.elo);
}

/**
 * Generates the html for the elo ranking page
 * @returns {string}
 */
function sendRankHtml() {
  const rankings = asOrderedTuples(calculate());
  let response = '<html><a href="/addPlayer">Add Player</a> - <a href="/addResult">Add Result</a><br />'
  rankings.forEach(ranking => {
    response += `<h1>${ranking.player}: ${ranking.elo}</h1>`;
  });

  response += "</html>";
  return response;
}

/**
 * Generates the html for the /addResult endpoint
 * @returns {string}
 */
function addResultForm() {
  const playerOptions = playerList.map(player => {
    return `<option>${player}</option>`;
  });

  const winnerSelect = `<select name="winner">${playerOptions}</select>`;
  const loserSelect = `<select name="loser">${playerOptions}</select>`;

  return `
    <html>
      <body>
        <form method="post" action="/addResult">
          <h3>Select Winner</h3>
          ${winnerSelect}
          <h3>Select Loser</h3>
          ${loserSelect}
          <br />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
    `;
}

/**
 * Adds a game result to the games list
 * @async
 * @param req {request} the request object from micro
 * @param res {response} the response object from micro
 * @returns {send result|string}
 */
async function addResult(req, res) {
  const { winner, loser } = await parse(req);
  if (!playerList.includes(winner) || !playerList.includes(loser) || winner == loser) {
    return send(res, 400, `Invalid game result (winner: ${winner}, loser: ${loser})`);
  }

  gameList.push({
    players: [winner, loser],
    startDate: moment().format(DATE_FORMAT),
    endDate: moment().format(DATE_FORMAT),
    winner,
  });
  save();
  return `<html>Added game result with winner of ${winner} and loser of ${loser}. <a href="/addResult">Add another</a> or <a href="/">view rankings</a></html>`;
}

/**
 * Generates the html for the /addPlayer endpoint
 * @returns {string}
 */
function addPlayerForm() {
  return `
    <html>
      <body>
        <form method="post" action="/addPlayer">
          <input type="text" name="player" placeholder="Player Name" />
          <input type="submit" value="Submit">
        </form>
      </body>
    </html>
    `;
}

/**
 * Adds a player to the player list
 * @async
 * @param req {request} the request object from micro
 * @param res {response} the response object from micro
 * @returns {string}
 */
async function addPlayer(req) {
  const { player } = await parse(req);
  if (NAME_REGEX.test(player)) {
    playerList = _.uniq(playerList.concat(player));
    save();
    return `<html>Added ${player}. <a href="/addPlayer">Add another</a> or <a href="/">view rankings</a></html>`;
  } else {
    return `<html>Player "${player}" not added - names must be letters and underscores only (starting with a letter) and between 1 and 30 characters. <a href="/addPlayer">Try Again?</a></html>`;
  }
}

module.exports = router(
  post('/addPlayer', addPlayer),
  post('/addResult', addResult),
  get('/addPlayer', addPlayerForm),
  get('/addResult', addResultForm),
  get('/', sendRankHtml)
);
