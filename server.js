// load environment variables from .env file
// stores DB connection info safely - so password is not directly in code
require('dotenv').config();

// import required packages
const express = require('express');       // creating web server
const sql = require('mssql/msnodesqlv8'); // connecting to Microsoft SQL Server

// creates an express app - server where ppl can send requests to
const app = express();

// read data sent to server - send and receive data in JSON format
app.use(express.json());

// database configuration - informs node.js how to connect to db
const dbConfig = {
    server: 'localhost\\SQLEXPRESS',
    database: 'CLIMBDB',
    options: { trustedConnection: true } // use windows login credentials
};

// connect to database
sql.connect(dbConfig)
    .then(() => console.log('Connected to SQL Server via Windows Authentication'))
    .catch(err => console.log(err));

// test route
app.get('/', (req, res) => {
    res.send('CLIMB Server Running');
});

// start the server on port 3000
app.listen(3000, () => console.log('Server running on port 3000'));