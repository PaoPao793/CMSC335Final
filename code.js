process.stdin.setEncoding("utf8");

// command line args
// deal with the command line stuff 
if (process.argv.length != 2) {
  process.stdout.write(`Usage code.js\n`);
  process.exit(0);
}

const portNumber = 3000;

process.stdout.write(`Server started and running at http://localhost:${portNumber}\n`)
const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);

process.stdin.on("readable", function () {
  let dataInput = process.stdin.read();
  if (dataInput !== null) {
    let command = dataInput.trim();
    if (command === "stop") {
        process.stdout.write(`Shutting down the server\n`);
        process.exit(0);
    } 
    process.stdout.write(prompt);
    process.stdin.resume();
  }
});




// MongoDB stuff 
// MongoBD vars and requirements 
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') }) 

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const db = process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION; 

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${userName}:${password}@cluster0.cbcpfwi.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });



// Implementing endspoints (express)
const express = require("express"); /* Accessing express module */
const app = express(); /* app is a request handler function */
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));  // to use css 
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.listen(portNumber);

app.get('/code.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'code.js'));
});

app.get("/", (req, res) => {
  res.render("index");
  //res.sendFile(__dirname + "/index.html");
});

app.get("/activities", async (req, res) => {
  await client.connect();
  let filter = {};
  const cursor = client.db(db).collection(collection).find(filter);
        
  const result = await cursor.toArray();

  let activitiesTable = `<table class="center"`;
  activitiesTable += "<tr><th>Activity</th><th>Type</th><th>Participants</th><th>Price</th></tr>";

  result.forEach( act => {
    activitiesTable += `<tr><td>${act.activity}</td><td>${act.type}</td>`
    activitiesTable += `<td>${act.participants}</td><td>${act.price}</td></tr>`;
  });

  activitiesTable += "</table>";

  res.render('activities', { number : result.length, activitiesTable });

});


app.post("/", async (req, res) => {
  let activity = req.body.activity;
  let type = req.body.type;
  let price = req.body.price;
  let participants = req.body.participants;

  console.log(activity);

  // to add the activity
  let toAdd = { activity, type, participants, price };
  await client.db(db).collection(collection).insertOne(toAdd);

});

app.get("/find", async (req, res) => {
  let activities = [];

  let data;
  for (let i = 0; i < 10; i++) {
    const response = await fetch(`http://www.boredapi.com/api/activity/`);
    data = await response.json();

    activities.push({
      activity: data.activity,
      type: data.type,
      participants: data.participants,
      price: data.price
    });
  }

  let findTable = `<table class="center">`;
  findTable += "<tr><th>Activity</th><th>Type</th><th>Participants</th><th>Price</th></tr>"

  activities.forEach(act => {
    findTable += `<tr><td>${act.activity}</td><td>${act.type}</td>`
    findTable += `<td>${act.participants}</td><td>${act.price}</td></tr>`;
  });

  findTable += "</table>";
  res.render('find', { findTable });
});



