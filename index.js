//import required modules
const express = require("express");
// const path = require("path");
const cors = require("cors"); // lets this API allow requests from other servers
const dotenv = require("dotenv");

dotenv.config();

//set up Express object and port
const app = express();
const port = process.env.PORT || "8888";

//set up jsonwebtokens
const jwt=require('jsonwebtoken');

//MongoDB
const { MongoClient } = require("mongodb");
const dbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_HOST}/?retryWrites=true&w=majority`
const client = new MongoClient(dbUrl);
const { ObjectId } = require("mongodb");

app.use(express.urlencoded({extended:true}));
app.use(express.json());

//allows requests from all servers
app.use(cors({
    origin: "*"
}));

//set up server listening
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
})

//create connection to database
async function connection() {
    db = client.db("timesheetdb"); //Change to the name of your mongo database
    return db;
}

app.get("/regusers", async (request, response) => {
    let regusers = await getAllRegUsers();
    response.json(regusers); //everytime a request is sent to /regusers, a response of an array of registered user json objects is received
}) 

async function getAllRegUsers() {
    db = await connection();
    let results = db.collection("registeredusers").find({}); //Change "registeredusers" to name of your mongodb collection
    res = await results.toArray();
    return res; //returns an array of all the registered users as json objects
}

