const fs = require('fs');
const _ = require('lodash');
const { send } = require('micro');
const parse = require('urlencoded-body-parser');
const { router, get, post } = require('microrouter');
const EloRank = require('elo-rank');
const elo = new EloRank(25);
const DEFAULT_ELO = 1000;

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

function save() {
  console.info('Saving data files...');
  fs.writeFileSync('./games.json', JSON.stringify(gameList), 'utf8');
  fs.writeFileSync('./players.json', JSON.stringify(playerList), 'utf8');
}

function calculate() {

  const rankings = {}
  playerList.forEach(player => {
    rankings[player] = DEFAULT_ELO;
  });

  // Extract all the completed games
  const finishedGames = gameList.filter(game => {
    return !!(game.winner && game.endDate);
  });

  // Loop through completed games to update rankings
  finishedGames.forEach(game => {
    // Loop through each player in the game
    game.players.forEach((player, idx) => {
      // TODO: If we support more than 2 players in a game, then we'll need to update this logic, but elo should support it
      const otherIdx = 1 - idx; // Trick to get the opposite index of the current one (1 -> 0 | 0 -> 1)
      const otherPlyr = game.players[otherIdx];
      const prevRating = rankings[player];
      const expectedScore = elo.getExpected(prevRating, rankings[otherPlyr]);
      const actualScore = (game.winner === player) ? 1 : 0;
      rankings[player] = elo.updateRating(expectedScore, actualScore, prevRating);
    });
  });

  return rankings;
}

function asOrderedTuples(rankings) {
  const asTuples = Object.keys(rankings).map(player => ({player, elo: rankings[player]}));
  return asTuples.sort((a, b) => b.elo - a.elo);
}

function sendRankHtml() {
  const rankings = asOrderedTuples(calculate());
  let response = '<html><a href="/addPlayer">Add Player</a> - <a href="/addResult">Add Result</a><br />'
  rankings.forEach(ranking => {
    response += `<h1>${ranking.player}: ${ranking.elo}</h1>`;
  });

  response += "</html>";
  return response;
}

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

async function addResult(req, res) {
  const { winner, loser } = await parse(req);
  if (!playerList.includes(winner) || !playerList.includes(loser) || winnet == loser) {
    return send(res, 400, `Invalid game result (winner: ${winner}, loser: ${loser})`);
  }

  gameList.push({
    [winner]: 1,
    [loser]: 0,
  });
  save();
  return `<html>Added game result with winner of ${winner} and loser of ${loser}. <a href="/addResult">Add another?</a></html>`;
}

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

async function addPlayer(req) {
  const { player } = await parse(req);
  if (NAME_REGEX.test(player)) {
    playerList = _.uniq(playerList.concat(player));
    save();
    return `<html>Added ${player}. <a href="/addPlayer">Add another?</a></html>`;
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
