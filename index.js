const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

const app = express();
const port = process.env.PORT || "8888";

const jwt = require('jsonwebtoken');

const { MongoClient } = require("mongodb");
const dbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_HOST}/?retryWrites=true&w=majority`;
const client = new MongoClient(dbUrl);
const { ObjectId } = require("mongodb");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Enable CORS to allow requests from the frontend
app.use(cors({
    origin: `${process.env.VITE_CLIENT_URL}`,
    credentials: true,
}));



app.post("/signup", async (request, response) => {
    const { username, password } = request.body;

    try {
        // Check if the user already exists
        let existingUser = await getUserByUsername(username);
        if (existingUser.length > 0) {
            return response.status(409).json({ message: 'User already exists' }); // Conflict
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store the new user in the database
        const db = await connection();
        const result = await db.collection("registeredusers").insertOne({
            username: username,
            password: hashedPassword
        });

        const newUserId = result.insertedId; // Get the ID of the newly created user

        // Generate JWT with user ID
        const userPayload = { username: username, id: newUserId };
        const accessToken = jwt.sign(userPayload, process.env.ACCESS_TOKEN_SECRET);

        // Respond with access token and user ID
        response.status(201).json({ accessToken: accessToken, userId: newUserId });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Server error' });
    }
});

app.post("/login", async (request, response) => {
    const { username, password } = request.body;

    try {
        // Query the database for the user based on the username
        let user = await getUserByUsername(username);

        if (user.length > 0) {
            const validUser = user[0]; // Get the user object from the array

            // Compare the provided password with the hashed password
            const isPasswordValid = await bcrypt.compare(password, validUser.password);

            if (isPasswordValid) {
                // Include the user's ID in the JWT
                const userPayload = { username: username, id: validUser._id };
                const accessToken = jwt.sign(userPayload, process.env.ACCESS_TOKEN_SECRET);

                // Send the JSON response with the access token
                response.json({ accessToken: accessToken, userId: validUser._id });
            } else {
                response.sendStatus(401); // Unauthorized, wrong password
            }
        } else {
            response.sendStatus(401); // Unauthorized, user not found
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Server error' });
    }
});

// Route to get user information by userId
app.get("/user/:userId", async (request, response) => {
    const { userId } = request.params; // Get userId from the request parameters

    try {
        const db = await connection();
        const user = await db.collection("registeredusers").findOne({ _id: new ObjectId(userId) });

        if (user) {
            // Exclude the password field before sending the response
            const { password, ...userWithoutPassword } = user;
            response.json(userWithoutPassword); // Send the user data without password
        } else {
            response.sendStatus(404); // User not found
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Server error' });
    }
});

// Endpoint to get activities for a specific user
app.get("/activities", async (request, response) => {
    const { username } = request.query; // Get the username from the query parameters

    try {
        const db = await connection();
        const activities = await db.collection("activities").find({ username: username }).toArray();
        
        response.json(activities); // Return the activities as a JSON response
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Server error' });
    }
});


app.post("/activities", async (request, response) => {
    const { username, activityName, timeTaken, date } = request.body;
    console.log("Received activity data:", request.body);

    if (!username || !activityName || !timeTaken || !date) {
        return response.status(400).json({ message: 'Missing required fields' });
      }

    try {
        // Store the activity in the database
        const db = await connection();
        const result = await db.collection("activities").insertOne({
            username: username,
            activityName: activityName,
            timeTaken: timeTaken,
            date: date,
        });

        response.status(201).json({ message: 'Activity added', activityId: result.insertedId });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Server error' });
    }
});


// Helper function to check if a user exists by username
async function getUserByUsername(username) {
    db = await connection();
    let result = db.collection("registeredusers").find({ username: username });
    return await result.toArray();
}




async function getRegUser(username, password) {
    db = await connection();
    let results = db.collection("registeredusers").find({
        username: username,
        password: password
    });
    res = await results.toArray();
    return res;
}

async function connection() {
    db = client.db("timesheetdb");
    return db;
}

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});
