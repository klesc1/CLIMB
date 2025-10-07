// load environment variables from .env file
// .env keeps info safe
require('dotenv').config();

//import packages
const express = require('express');         //web server
const sql = require('mssql/msnodesqlv8');   //connecting sql server
const bcrypt = require('bcryptjs');         //hash passwords
const session = require('express-session'); //manage user login sessions

//starts server - creates an express app - server where ppl can send requests to
const app = express();

//read data sent to server - send and receive data in JSON format
app.use(express.json());

//session setup
app.use(session({
    secret: process.env.SESSION_SECRET, //loaded from .env
    resave: false,
    saveUninitialized: true
}));

//database config - informs node.js how to connect to db
const dbConfig = {
    server: 'localhost\\SQLEXPRESS',
    database: 'CLIMBDB',
    options: { trustedConnection: true } //use windows login
};

//connect to db server
sql.connect(dbConfig)
    .then(() => console.log('Connected to SQL Server'))
    .catch(err => console.log('SQL Error: ', err));

// ROUTES    
//test route
app.get('/', (req, res) => {
    res.send('CLIMB Server Running');
});

// REGISTER USER
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    //validation
    if (!username || !email || !password) {
        return res.status(400).send('All fields are required');
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Invalid email format');
    }
    if (password.length < 6) {
        return res.status(400).send('Password must be at least 6 characters');
    }

    try {
        //hash password before saving
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        //insert user into db
        const request = new sql.Request();
        request.input('username', sql.NVarChar, username);
        request.input('email', sql.NVarChar, email);
        request.input('password_hash', sql.NVarChar, passwordHash);
        await request.query(`
            INSERT INTO Users (username, email, password_hash)
            VALUES (@username, @email, @password_hash)
        `);

        res.send('User registered successfully');
    } catch (err) {
        console.log(err);
        res.status(500).send('Error registering user');
    }
});


// LOGIN USER
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('All fields are required');
    }

    try {
        const request = new sql.Request();
        request.input('email', sql.NVarChar, email);

        const result = await request.query(`
            SELECT * FROM Users WHERE email=@email
        `);

        if (result.recordset.length === 0) {
            return res.status(400).send('No user found with this email');
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).send('Incorrect password');
        }

        req.session.userId = user.id;

        res.send(`Logged in successfully, Welcome ${user.username}`);
    } catch (err) {
        console.log('LOGIN ERROR: ', err);
        res.status(500).send('Error logging in');
    }
});



// LOGOUT USER
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log('LOGOUT ERROR: ', err);
            return res.status(500).send('Error logging out');
        }
        res.send('Logged out successfully');
    });
});

//start server
app.listen(3000, () => console.log('Server running on port 3000'));