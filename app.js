const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const path = require("path");
const databasePath = path.join(__dirname, "covid19India.db");
const sqlite3 = require("sqlite3");

// DataBase Connection Initializing. and Server:
let dbConnection = null;
const initializingDbAndServer = async () => {
  try {
    dbConnection = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (Errors) {
    console.log(`DB Error: ${Errors.message}`);
  }
};
initializingDbAndServer();

// writing Api's to perform CRUD operations on the tables:

// Get List of States by using API:
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStateListWithSqlQuery = `
    SELECT *
    FROM
    state;
    `;
  const stateList = await dbConnection.all(getStateListWithSqlQuery);
  response.send(
    stateList.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//Get Specific State by using API:
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getSpecificStateWithSqlQuery = `
    SELECT *
    FROM
    state
    WHERE
    state_id = ${stateId};
    `;
  const specificState = await dbConnection.get(getSpecificStateWithSqlQuery);
  response.send(convertDbObjectToResponseObject(specificState));
});

// Create District details using API:
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const createDistrictDetailsWithSqlQuery = `
    INSERT INTO 
    district (district_name, state_id, cases,cured, active, deaths)
    VALUES
    (
        "${districtName}",
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );
    `;
  await dbConnection.run(createDistrictDetailsWithSqlQuery);
  response.send("District Successfully Added");
});

//Get Specific District using API:
const convertDBObjectToresponseObject = (dist) => {
  return {
    districtId: dist.district_id,
    districtName: dist.district_name,
    stateId: dist.state_id,
    cases: dist.cases,
    cured: dist.cured,
    active: dist.active,
    deaths: dist.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getSpecificDistrictWithSqlQuery = `
    SELECT *
    FROM
    district
    WHERE
    district_id = ${districtId};
    `;
  const district = await dbConnection.get(getSpecificDistrictWithSqlQuery);
  response.send(convertDBObjectToresponseObject(district));
});

//Delete Specific District using API:
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteSpecificDistrictWithSqlQuery = `
    DELETE
    FROM
    district
WHERE
district_id = ${districtId};
    `;
  await dbConnection.run(deleteSpecificDistrictWithSqlQuery);
  response.send("District Removed");
});

// Update District details using API:
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictDetailsWithSQLQuery = `
    UPDATE
    district
    SET
        district_name = "${districtName}",
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
        WHERE 
        district_id = ${districtId};

    `;
  await dbConnection.run(updateDistrictDetailsWithSQLQuery);
  response.send("District Details Updated");
});

//Get specific State of stats using API:
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getSpecificStateOfStatsWithSqlQuery = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM
    district
    WHERE
    state_id = ${stateId};
    `;
  const stats = await dbConnection.get(getSpecificStateOfStatsWithSqlQuery);
  //console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

// Get State name With specific districtId using API:
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStatenameWithSqlQuery = `
    SELECT 
    state_name
    FROM
    state JOIN district
    ON state.state_id = district.state_id
    WHERE
    district.district_id = ${districtId};
    `;
  const stateName = await dbConnection.get(getStatenameWithSqlQuery);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;
