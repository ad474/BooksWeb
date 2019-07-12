//jshint esversion:6

require('dotenv').config();
const express= require("express");
const bodyParser= require("body-parser");
const mongoose= require("mongoose");
const encrypt = require('mongoose-encryption');

const app=express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/bookDB", { useNewUrlParser: true });

const personSchema=new mongoose.Schema({
  username:String,
  password: String
});
//
// personSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const Person= mongoose.model("Person",personSchema);

app.get("/",function(req,res){
  res.render('index', {filler: ""});
});

app.get("/register", function(req,res){
  res.render('register', {filler: ""});
});

app.post("/",function(req,res){
  //console.log(req.body);
  Person.findOne({username:req.body.username}, function(err,person){
    if(err){
      console.log(err);
    }
    else{
      if(person===null){
        res.render('index', {filler: "This user does not exist. Try again."});
      }
      else{
        if(person.password===req.body.password){
          res.send("Success");
        }
        else{
          res.render('index', {filler: "This user does not exist. Try again. Password problem"});
        }
      }
    }
  });
});

app.post("/register",function(req,res){
  const person=new Person({
    username: req.body.username,
    password: req.body.password
  });
  Person.find({username:req.body.username},function(err,persons){
    if(err){
      console.log(err);
    }
    else{
      if(persons.length===0){
        person.save();
      }
      else{
        res.render('register', {filler: "Username taken. Please try again."});
      }
    }
  });
});

app.listen(3000, function() {
  console.log("Server has started successfully");
});
