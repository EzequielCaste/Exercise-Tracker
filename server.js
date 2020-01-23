const express = require('express')
const app = express()
var sha = require("sha-1");
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const moment = require("moment")

mongoose.connect("mongodb+srv://eze:fcc456@cluster0-py5g6.mongodb.net/test?retryWrites=true&w=majority",
                 { useUnifiedTopology: true , useNewUrlParser: true }, function(err){
  if(err) return console.log(err)
  
  return console.log(mongoose.connection.readyState)  
  
});

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(express.static('public'))

// INDEX ROUTE
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// DEFINE SCHEMAS
var userSchema = new mongoose.Schema({
  _id: String,
  username: String  
});

let taskSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
})

// { type: Date, default: Date(Date.now()).substring(0,16) }
let Task = mongoose.model("Task", taskSchema)  
let User = mongoose.model("User", userSchema);


/*
1. I can create a user by posting form data username to /api/exercise/new-user 
and returned will be an object with username and _id.
*/

app.post("/api/exercise/new-user", (req, res, next) => {
  const username = req.body.username;
  if(username){
    User.findOne({username: username}, (error, data) =>{
      if(data){
        res.send("Username taken.")
      } else {
        const newUser = {username: username, _id: sha(req.body.username).substring(0,7)}
        User.create(newUser, (error, user)=>{
          if(error) return next(error);
          res.json({username:user.username, _id: user._id})
        })
      }
    })    
    
  } else {
    res.send("Please provide a username")
  }  
})


/*
2. I can get an array of all users by getting api/exercise/users 
with the same info as when creating a user.
*/

app.get("/api/exercise/users", (req,res,next)=>{
  User.find({}, (error, users)=>{
     if(error) return next(error);
    res.send(users);
  })  
})

/*
3. I can add an exercise to any user by posting form data userId(_id), description, 
duration, and optionally date to /api/exercise/add. 
If no date supplied it will use current date. 
Returned will be the user object with also the exercise fields added.
*/

app.post("/api/exercise/add", (req,res,next)=>{
  const userId = req.body.userId;
  const description = req.body.description
  const duration = req.body.duration
  const date = req.body.date ? new Date(req.body.date).toUTCString().substring(0,16) : new Date(Date.now()).toUTCString().substring(0,16)
  
  if(userId && description && duration){
    //res.send("correct")
    User.find({_id:userId}, (error,user)=>{
      if(error) return next(error);
      //console.log(user)
      const newTask = {
        username: user[0].username,
        description: description,
        duration: duration,
        date: date
      }
      Task.create(newTask, (error, task)=>{
        if(error) return next(error);
        res.json(newTask)
      })
      
      //res.send(user)
    })
  } else {
    res.send("please fill out the form")
  }
  //console.log(date)
})


/*
4. I can retrieve a full exercise log of any user by getting 
/api/exercise/log with a parameter of userId(_id). 
Return will be the user object with added array log and count (total exercise count).
 /api/exercise/log?userId=056eafe

5. I can retrieve part of the log of any user by also passing 
along optional parameters of from & to or limit. (Date format yyyy-mm-dd, limit = int)
*/


app.get("/api/exercise/log", (req,res,next)=>{
  const fromDate = new Date(req.query.from);
  const toDate = new Date(req.query.to)
  const limitTasks = req.query.limit
  
  
 User.findOne({_id: req.query.userId}, (error, foundUser)=>{
      if(error) {
        next(error) 
        return}
      
      if(foundUser){
        
        Task.find({username: foundUser.username}, (error,foundTasks)=>{
          
          let results = foundTasks;
          
          if(fromDate!="Invalid Date"){            
            results = foundTasks.filter(item => moment(item.date).isAfter(fromDate) )
          }
          
          if(toDate!="Invalid Date"){
            results = results.filter(item => moment(item.date).isBefore(toDate))
          }
          
          if(limitTasks){
            results = results.slice(0, limitTasks)
          }
          
          res.json({
            _id: foundUser._id,
            username: foundUser.username,
            count: foundTasks.length,
            log: results
          })
        })
        
      } else {
        res.send("User ID not found.")
      }
      
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
