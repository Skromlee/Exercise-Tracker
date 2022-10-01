const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Schema = mongoose.Schema;
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = Schema({
  username: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: Date
  }]
});

let User = mongoose.model('User', userSchema);

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  createNewUser(req.body.username, (err, addedUser) => {
    if(err) return res.json(err);
    res.json({
      username: addedUser.username,
      _id: addedUser._id
    });
  });
});

app.get('/api/users', (req, res) => {
  displayAllUser((err, allUser) => {
    if(err) return res.json(err);
    const allUserArr = [];
    allUser.forEach((obj) => {
      allUserArr.push({username:obj.username, _id:obj._id.toString()});
    });
    res.json(allUserArr);
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  findEditThenSave(userId, req.body, (err, result) => {
    if(err) return res.json(err);
    res.json({
      _id:result._id,
      username:result.username,
      date:result.log[result.count - 1].date.toDateString().toString(),
      duration:result.log[result.count - 1].duration,
      description:result.log[result.count - 1].description
    });
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  let from;
  let to;
  let limit;
  let logArr = [];
  let dateCheck = false;
  
  if(req.query.from && req.query.to){
    from = req.query.from;
    to = req.query.to;
    dateCheck = true;
  } else if (req.query.limit) {
    limit = req.query.limit;
  }
  const userId = req.params._id;
  
  displayLogs(userId, (err, user) => {
    if(err) return res.json(err);
    
    let maxLogs;
    if(limit){
      maxLogs = limit;
    } else {
      maxLogs = user[0].log.length;
    }
    
    for(let i = 0; i < maxLogs; i++){
      if(dateCheck){
        console.log("needCheck");
        if(Date.parse(user[0].log[i].date) >= Date.parse(from) && Date.parse(user[0].log[i].date) <= Date.parse(to)){
            logArr.push({
            description:user[0].log[i].description,
            duration:user[0].log[i].duration,
            date:new Date(user[0].log[i].date).toDateString().toString()
          });
        }
      } else {
        console.log("dosen't check");
          logArr.push({
          description:user[0].log[i].description,
          duration:user[0].log[i].duration,
          date:new Date(user[0].log[i].date).toDateString().toString()
        });
      }
    }
    
    res.json({
      _id:user[0]._id,
      username:user[0].username,
      count:user[0].count,
      log: logArr
    });
  });
});


// method
const createNewUser = (userName, done) => {
  let user = new User({username: userName, count: 0});
  user.save((err, addedUser) => {
    if(err) return done(err, null);
    done(null, addedUser);
  });
};

const displayAllUser = (done) => {
  User.find((err, allUser) => {
    if(err) return done(err, null);
    done(null, allUser);
  })
}

const findEditThenSave = (userId, reqBody, done) => {
  User.findById(userId, (err, user) => {
    if(err) return done(err,null);
    let date;
    if(reqBody.date){
      date = new Date(reqBody.date);
    } else {
      date = new Date();
    }
    user.log.push({
      description: reqBody.description,
      duration: reqBody.duration,
      date: date
    });
    user.count ++;
    user.save((err, updatedUser) => {
      if(err) return done(err, null);
      done(null, updatedUser);
    });
  });
};

const displayLogs = (userId, done) => {
  User.find({ _id:userId }, (err, user) => {
    if(err) return done(err, null);
    done(null, user);
  });
};

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
