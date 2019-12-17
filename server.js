const express = require('express')
const app = express()
var sha = require("sha-1");
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')

mongoose.connect("mongodb+srv://eze:fcc456@cluster0-py5g6.mongodb.net/test?retryWrites=true&w=majority",
                 { useUnifiedTopology: true , useNewUrlParser: true }, function(err){
  if(err) return console.log(err)
  
  return console.log(mongoose.connection.readyState)  
  
});

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

/*

4. I can retrieve a full exercise log of any user by getting /api/exercise/log with a parameter of userId(_id). Return will be the user object with added array log and count (total exercise count).
5. I can retrieve part of the log of any user by also passing along optional parameters of from & to or limit. (Date format yyyy-mm-dd, limit = int)

*/


var userSchema = new mongoose.Schema({
  _id: String,
  username: String  
});

let taskSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now }
})

let Task = mongoose.model("Task", taskSchema)
  

let User = mongoose.model("User", userSchema);

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

/*
1. I can create a user by posting form data username to /api/exercise/new-user 
and returned will be an object with username and _id.
*/

app.post("/api/exercise/new-user/", function(req,res){

    User.findOne({username: req.body.username}, function(err,found){
    if(err) return console.log(err)
    
      if(found){      
        res.json({
          username: found.uName,
          _id: found._id
        })
      } else {
        console.log("not found2", req.body.username)

        //CREATE NEW USER

        User.create({username: req.body.username, _id: sha(req.body.username).substring(0,7)}, function(err, created){
              if(err) return console.log(err)

              res.json({
                username: created.username,
                _id: created._id
              })

        })
    }  
})
})

/*
2. I can get an array of all users by getting api/exercise/users 
with the same info as when creating a user.
*/

app.get("/api/exercise/users/", function(req,res){
  User.find({}, function(err, found){
    res.json(found)
  })
})




// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
}) 

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
