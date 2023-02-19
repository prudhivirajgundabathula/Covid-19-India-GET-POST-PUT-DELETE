const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateDBObjecttoResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convrtDistrictDBObjectToResponsiveObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//GET API METHOD Returns a list of all states in the state table

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const stateArray = await database.all(getStatesQuery);
  response.send(
    stateArray.map((eachState) =>
      convertStateDBObjecttoResponseObject(eachState)
    )
  );
});

//GET API METHOD Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateNameQuery = `SELECT * FROM state WHERE state_id = ${stateId}`;
  const getState = await database.get(getStateNameQuery);
  response.send(convertStateDBObjecttoResponseObject(getState));
});

//POST METHOD Create a district in the district table, district_id is auto-incremented

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `INSERT INTO district  (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths} )`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//GET METHOD Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId}`;
  const districtArray = await database.get(getDistrictQuery);
  response.send(convrtDistrictDBObjectToResponsiveObject(districtArray));
});

//DELETE METHOD API Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId}`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

// PUT METHOD Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `UPDATE district 
    SET 
    district_name = '${districtName}',
    state_id = ${stateId}, 
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
WHERE district_id = ${districtId}`;
  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//GET METHOD API Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths) FROM district  WHERE state_id = ${stateId}`;
  const stats = await database.get(getStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//GET METHOD API Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateDetails = `SELECT state_name FROM district NATURAL JOIN state where district_id = ${districtId}`;
  const state = await database.get(getStateDetails);
  response.send({ stateName: state.state_name });
});

module.exports = app;
