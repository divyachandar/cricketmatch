const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (error) {
    console.log(`Data base Error is ${error}`);
    process.exit(1);
  }
};
initializeDbAndServer();
const convertDbObject = (objectItem) => {
  return {
    playerId: objectItem.player_id,
    playerName: objectItem.player_name,
    matchId: objectItem.match_id,
    match: objectItem.match,
    year: objectItem.year,
    playerMatchId: objectItem.player_match_id,
    score: objectItem.score,
    fours: objectItem.fours,
    sixes: objectItem.sixes,
  };
};

//Returns a list of all the players in the player table
// API 1

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `select * from player_details;`;
  const getPlayerQueryResponse = await db.all(getPlayerQuery);
  response.send(
    getPlayerQueryResponse.map((eachPlayer) => convertDbObject(eachPlayer))
  );
});

//Returns a specific player based on the player ID
// API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetailsQuery = `select * from player_details where  player_id=${playerId};`;
  const getPlayerDetailsQueryResponse = await db.get(getPlayerDetailsQuery);
  response.send(convertDbObject(getPlayerDetailsQueryResponse));
});

//Updates the details of a specific player based on the player ID
// API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerDetailsQuery = `update player_details set 
    player_name='${playerName}' where player_id=${playerId};`;
  await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match
// API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `select * from match_details where  match_id=${matchId};`;
  const getMatchDetailsQueryResponse = await db.get(getMatchDetailsQuery);
  response.send(convertDbObject(getMatchDetailsQueryResponse));
});

// Returns a list of all the matches of a player
// API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchOfPlayerQuery = `select  match_id,match,year from match_details natural join player_match_score 
  where  player_id=${playerId};`;
  const getMatchOfPlayerQueryResponse = await db.all(getMatchOfPlayerQuery);
  response.send(
    getMatchOfPlayerQueryResponse.map((eachPlayer) =>
      convertDbObject(eachPlayer)
    )
  );
});

// Returns a list of players of a specific match
// API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfSpecificMatchQuery = `select  player_id,player_name from player_details natural join player_match_score 
  where  match_id=${matchId};`;
  const getPlayersOfSpecificMatchQueryResponse = await db.all(
    getPlayersOfSpecificMatchQuery
  );
  response.send(
    getPlayersOfSpecificMatchQueryResponse.map((eachPlayer) =>
      convertDbObject(eachPlayer)
    )
  );
});
// Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
// API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersScoresQuery = `select 
   player_details.player_id,player_details.player_name,
   sum(player_match_score.score) as  totalScore,
    sum(player_match_score.fours) as  totalFours,
     sum(player_match_score.sixes) as  totalSixes
    from player_details inner join player_match_score 
    on player_details.player_id=player_match_score.player_id
  where player_details.player_id=${playerId};`;
  const getPlayersScoresQueryResponse = await db.get(getPlayersScoresQuery);
  response.send(convertDbObject(getPlayersScoresQueryResponse));
});

module.express = app;
