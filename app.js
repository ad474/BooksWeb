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
  password: String,
  name: String
});

const Person= mongoose.model("Person",personSchema);

const bookSchema=new mongoose.Schema({
  bookname: String,
  author:String,
  chapters: Number,
  username: String
});

const Book= mongoose.model("Book", bookSchema);

const reviewSchema= new mongoose.Schema({
  username: String,
  bookname: String,
  chapterno: Number, //wary about you
  thoughts: String
});

const Review= mongoose.model("Review", reviewSchema);

var usname="";

app.get("/",function(req,res){
  res.render('index', {filler: ""});
});

app.get("/register", function(req,res){
  res.render('register', {filler: ""});
});

app.post("/account", function(req,res){
  Person.findOne({username:req.body.username}, function(err,person){
    if(err){
      console.log(err);
    }
    else{
      if(person===null){
        //wrong username
        res.render('index', {filler: "This user does not exist. Try again."});
      }
      else{
        if(person.password===req.body.password){
          //when match
          Book.find({username:req.body.username}, function(err,books){
            if(err){
              console.log(err);
            }
            else{
              if(books.length===0){
                //if no books added yet
                res.render('homepage',{hname:person.name, flag:true});

              }
              else{
                //if books added already
                console.log(books);
              }
            }
          });
        }
        else{
          res.render('index', {filler: "This user does not exist. Try again. Password problem"});
        }
      }
    }
  });
});

app.get("/homepage", function(req,res){

});

app.post("/register",function(req,res){
  const person=new Person({
    username: req.body.username,
    password: req.body.password,
    name: req.body.name
  });
  Person.find({username:req.body.username},function(err,persons){
    if(err){
      console.log(err);
    }
    else{
      if(persons.length===0){
        person.save();
        res.render('index', {filler: "Login with your credentials now!"});
      }
      else{
        res.render('register', {filler: "Username taken. Please try again."});
      }
    }
  });
});

app.post("/add",function(req,res){
  res.render('addbook');
});

app.post("/added", function(req,res){

});

app.listen(3000, function() {
  console.log("Server has started successfully");
});
