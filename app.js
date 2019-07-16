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
          usname=req.body.username;
          res.redirect("/homepage");
        }
        else{
          res.render('index', {filler: "This user does not exist. Try again. Password problem"});
        }
      }
    }
  });
});

app.get("/homepage", function(req,res){
  Person.findOne({username:usname}, function(err,person){
    if(err){
      console.log(err);
    }
    else{
      Book.find({username:usname}, function(err,books){
        if(err){
          console.log(err);
        }
        else{
          if(books.length===0){
            //if no books added yet
            res.render('homepage',{hname:person.name, flag:true, flag2:false, bookPosts:[]});

          }
          else{
            //if books added already
            res.render('homepage',{hname:person.name, flag:false, flag2:true, bookPosts:books});
          }
        }
      });
    }
  });
});

app.post("/add",function(req,res){
  res.render('addbook');
});

app.post("/added", function(req,res){
  const book=new Book({
    bookname: req.body.bookname,
    author:req.body.authname,
    chapters: req.body.chapno,
    username: usname
  });
  book.save();
  res.redirect("/homepage");
});

app.post("/chapters", function(req, res){
  Book.findOne({username:usname, bookname:req.body.button}, function(err,fbook){
    if(err){
      console.log(err);
    }
    else{
      res.render('chapters',{bookName:fbook.bookname, authName:fbook.author, chapNo:fbook.chapters});
    }
  });
});


app.post("/notes", function(req,res){
  Review.find({username:usname, bookname:req.body.bookname, chapterno: req.body.chapno}, function(err,rev){
    if(err){
      console.log(err);
    }
    else{
      if(rev.length===0){
        res.render("review",{flag1:true, flag2:false, review:[],chapno:req.body.chapno,bookname:req.body.bookname});
      }
      else{
        res.render("review",{flag1:false, flag2:true, review:rev[0],chapno:req.body.chapno,bookname:req.body.bookname});
      }
    }
  });
});

app.post("/reviewsubmit",function(req,res){
  //req.body.review
  //req.body.chapno
  //req.body.bookname
  const review= new Review({
    username: usname,
    bookname: req.body.bookname,
    chapterno: req.body.chapno,
    thoughts: req.body.review
  });
  review.save();
  Book.findOne({username:usname, bookname:req.body.bookname}, function(err,fbook){
    if(err){
      console.log(err);
    }
    else{
      res.render('chapters',{bookName:fbook.bookname, authName:fbook.author, chapNo:fbook.chapters});
    }
  });
});

app.post("/reviewsubmitt",function(req,res){
  console.log(req.body);
  //req.body.review
  //req.body.chapno
  //req.body.bookname
  Review.updateOne({username:usname,bookname:req.body.bookname,chapterno:req.body.chapno},{thoughts:req.body.review},function(err){
    if(err){
      console.log(err);
    }
    else{
      Book.findOne({username:usname, bookname:req.body.bookname}, function(err,fbook){
        if(err){
          console.log(err);
        }
        else{
          res.render('chapters',{bookName:fbook.bookname, authName:fbook.author, chapNo:fbook.chapters});
        }
      });
    }
  });
});

app.post("/allnotes",function(req,res){
  Review.find({username:usname, bookname:req.body.bookname}).sort({ chapterno : 'ascending'}).exec(function(err, result){
    if(err){
      console.log(result);
    }
    else{
      if(result.length===0){
        res.render("norev",{bookname:req.body.bookname});
      }
      else{
        res.render("allnotes",{bookname:req.body.bookname,reviews:result});
      }
    }
  });
});

app.post("/ex", function(req,res){
  res.redirect("/homepage");
});

app.post("/logout", function(req,res){
  res.redirect("/");
});

app.listen(3000, function() {
  console.log("Server has started successfully");
});
