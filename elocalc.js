const fs = require('fs');
const EloRank = require('elo-rank');
const elo = new EloRank(25);
const DEFAULT_ELO = 1000;

// players.json is a json array of strings representing unique player names
// games.json is an array of tuple objects containing player names as keys and 1 or 0 as values
// where 1 denotes the victorious player and 0 denotes the losing player
/* ...
 * {
 *   "someone": 1,
 *   "someoneElse": 0
 * }
 * ...
 */

function calculate() {
  const gameListFile = fs.readFileSync('./games.json', 'utf8');
  const playerListFile = fs.readFileSync('./players.json', 'utf8');

  const playerList = JSON.parse(playerListFile);
  const gameList = JSON.parse(gameListFile);

  const rankings = {}
  playerList.forEach(player => {
    rankings[player] = DEFAULT_ELO;
  });

  gameList.forEach(game => {
    const [playerA, playerB] = Object.keys(game);
    const playerAScore = rankings[playerA];
    const playerBScore = rankings[playerB];
    const expectedScoreA = elo.getExpected(playerAScore, playerBScore);
    const expectedScoreB = elo.getExpected(playerBScore, playerAScore);
    rankings[playerA] = elo.updateRating(expectedScoreA, game[playerA], playerAScore);
    rankings[playerB] = elo.updateRating(expectedScoreB, game[playerB], playerBScore);
  });

  return rankings;
}

module.exports = calculate;
