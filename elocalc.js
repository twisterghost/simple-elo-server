const EloRank = require('elo-rank');
const elo = new EloRank(25);
const DEFAULT_ELO = 1000;

// players.json is a json array of strings representing unique player names
const playerList = require('./players.json');

// games.json is an array of tuple objects containing player names as keys and 1 or 0 as values
// where 1 denotes the victorious player and 0 denotes the losing player
/* ...
 * {
 *   "someone": 1,
 *   "someoneElse": 0
 * }
 * ...
 */
const gameList = require('./games.json');

const players = {}
playerList.forEach(player => {
  players[player] = DEFAULT_ELO;
});

gameList.forEach(game => {
  const [playerA, playerB] = Object.keys(game);
  const playerAScore = players[playerA];
  const playerBScore = players[playerB];
  const expectedScoreA = elo.getExpected(playerAScore, playerBScore);
  const expectedScoreB = elo.getExpected(playerBScore, playerAScore);
  players[playerA] = elo.updateRating(expectedScoreA, game[playerA], playerAScore);
  players[playerB] = elo.updateRating(expectedScoreB, game[playerB], playerBScore);
});

console.dir(players);
