//jshint esversion:6

require('dotenv').config();
const express= require("express");
const bodyParser= require("body-parser");
const mongoose= require("mongoose");
const encrypt = require("mongoose-encryption");
const nodemailer= require("nodemailer");

const app=express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/bookDB", { useNewUrlParser: true });

const personSchema=new mongoose.Schema({
  username:String,
  password: String,
  name: String,
  email:String
});

personSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

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
  thoughts: String,
  bookID: String
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
    name: req.body.name,
    email: req.body.email
  });
  Person.find({username:req.body.username},function(err,persons){
    if(err){
      console.log(err);
    }
    else{
      if(persons.length===0){
        person.save();
        res.render('login', {filler: "Login with your credentials now!"});
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
        res.render('login', {filler: "Username/password incorrect. Try again."});
      }
      else{
        if(person.password===req.body.password){
          //when match
          usname=req.body.username;
          res.redirect("/homepage");
        }
        else{
          res.render('login', {filler: "Username/password incorrect. Try again."});
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

app.post("/login", function(req,res){
  res.redirect("/login");
});

app.get("/login", function(req,res){
  res.render("login", {filler:""});
});

app.get("/resetpass",function(req,res){
  res.render("resetpass", {filler:""});
});

var rand;

app.post("/resetpass",function(req,res){
  Person.find({email:req.body.email},function(err,per){
    if(err){
      console.log(err);
    }
    else{
      if(per.length===0){
        res.render("resetpass", {filler:"Email does not match any account"});
      }
      else{
        let transporter= nodemailer.createTransport({
          service: 'gmail',
          secure: false,
          post:25,
          auth:{
            user:'ankitad0219@gmail.com',
            pass:process.env.PASS
          },
          tls:{
            rejectUnauthorized: false
          }
        });
        rand= Math.floor(Math.random() * 89999)+10000;
        var toSend="Hey "+per[0].name+"! OTP for the reset of your password is "+rand+". Have a nice day!";
        let helperOptions= {
          from: '"Ankita Durgavajula" <ankitad0219@gmail.com',
          to:req.body.email,
          subject: 'Password reset for BookTab',
          text: toSend
        };
        transporter.sendMail(helperOptions, function(err,info){
          if(err){
            res.send(err);
          }
          else{
            res.render("otp",{filler:"",otp:rand,id:per[0]._id});
            //render the OTP page and send OTP and id
          }
        });
      }
    }
  });
});

app.post("/otp",function(req,res){
  if(req.body.otp==req.body.orotp){
      res.render("password",{id:req.body.id});
  }
  else{
    Person.findOne({_id:req.body.id},function(err,resu){
      if(err){
        console.log(err);
      }
      else{
        res.render("otp",{filler:"Wrong OTP entered",otp:rand,id:resu._id});
      }
    });
    //wrong otp
  }
});

app.post("/resetdone",function(req,res){
  Person.findOne({_id:req.body.id},function(err,result){
    if(err){
      console.log(err);
    }
    else{
      const person=new Person({
        username: result.username,
        password: req.body.password,
        name: result.name,
        email: result.email
      });
      person.save();
    }
  });
  Person.deleteOne({_id:req.body.id},function(err){
    if(err){
      console.log(err);
    }
    else{
      res.render("login", {filler:"Password is reset"});
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

app.post("/edit",function(req,res){
  Book.findOne({_id:req.body.id},function(err,result){
    if(err){
      console.log(err);
    }
    else{
      res.render('edit',{bookname:result.bookname,authname:result.author,chapno:result.chapters ,id:result._id});
    }
  });
});

app.post("/edited", function(req,res){
  Review.find({chapterno:{$gte: req.body.chapno}},function(err,resu){
    if(err){
      console.log(err);
    }
    else{
      console.log(resu);
    }
  });
  Review.deleteMany({chapterno:{$gte: req.body.chapno}},function(err){
    if(err){
      console.log(err);
    }
  });
  Book.updateOne({_id: req.body.id}, {bookname:req.body.bookname ,author:req.body.authname ,chapters:req.body.chapno}, function(err){
    if(err){
      console.log(err);
    }
    else{
      Review.updateMany({bookID:req.body.id}, {bookname:req.body.bookname},function(err){
        if(err){
          console.log(err);
        }
      });
      res.redirect("/homepage");
    }
  });
});

app.post("/delete", function(req,res){
  Book.deleteOne({_id: req.body.id}, function(err){
    if(err){
      console.log(err);
    }
    else{
      Review.deleteMany({bookID: req.body.id}, function(err){
        if(err){
          console.log(err);
        }
        else{
          res.redirect("/homepage");
        }
      });
    }
  });
});

app.post("/chapters", function(req, res){
  Book.findOne({username:usname, bookname:req.body.button}, function(err,fbook){
    if(err){
      console.log(err);
    }
    else{
      var ch=[];
      var tosend=[];
      Review.find({bookID:fbook._id},function(err,result){
        if(err){
          console.log(err);
        }
        else{
          result.forEach(function(r){
            ch.push(r.chapterno);
          });
          for (var i = 1; i <= fbook.chapters ; i++) {
            if(ch.indexOf(i)==-1){
              tosend.push({
                chapternum:i,
                flag:false
              });
            }
            else{
              tosend.push({
                chapternum:i,
                flag:true
              });
            }
          }
          res.render('chapters',{bookName:fbook.bookname, authName:fbook.author, chapNo:fbook.chapters, bookid:fbook._id,tosend:tosend});
        }
      });
    }
  });
});

app.post("/bthp", function(req,res){
  res.redirect("/homepage");
});

app.post("/notes", function(req,res){
  Review.find({username:usname, bookname:req.body.bookname, chapterno: req.body.chapno}, function(err,rev){
    if(err){
      console.log(err);
    }
    else{
      if(rev.length===0){
        res.render("review",{flag1:true, flag2:false, review:[],chapno:req.body.chapno,bookname:req.body.bookname,bookid:req.body.bookid});
      }
      else{
        res.render("review",{flag1:false, flag2:true, review:rev[0],chapno:req.body.chapno,bookname:req.body.bookname,bookid:req.body.bookid});
      }
    }
  });
});

app.post("/reviewsubmit",function(req,res){
  const review= new Review({
    username: usname,
    bookname: req.body.bookname,
    chapterno: req.body.chapno,
    thoughts: req.body.review,
    bookID: req.body.bookid
  });
  review.save();
  Book.findOne({username:usname, bookname:req.body.bookname}, function(err,fbook){
    if(err){
      console.log(err);
    }
    else{
      var ch=[];
      var tosend=[];
      Review.find({bookID:fbook._id},function(err,result){
        if(err){
          console.log(err);
        }
        else{
          result.forEach(function(r){
            ch.push(r.chapterno);
          });
          for (var i = 1; i <= fbook.chapters ; i++) {
            if(ch.indexOf(i)==-1){
              tosend.push({
                chapternum:i,
                flag:false
              });
            }
            else{
              tosend.push({
                chapternum:i,
                flag:true
              });
            }
          }
          res.render('chapters',{bookName:fbook.bookname, authName:fbook.author, chapNo:fbook.chapters, bookid:fbook._id,tosend:tosend});
        }
      });
    }
  });
});

app.post("/reviewsubmitt",function(req,res){
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
          var ch=[];
          var tosend=[];
          Review.find({bookID:fbook._id},function(err,result){
            if(err){
              console.log(err);
            }
            else{
              result.forEach(function(r){
                ch.push(r.chapterno);
              });
              for (var i = 1; i <= fbook.chapters ; i++) {
                if(ch.indexOf(i)==-1){
                  tosend.push({
                    chapternum:i,
                    flag:false
                  });
                }
                else{
                  tosend.push({
                    chapternum:i,
                    flag:true
                  });
                }
              }
              res.render('chapters',{bookName:fbook.bookname, authName:fbook.author, chapNo:fbook.chapters, bookid:fbook._id,tosend:tosend});
            }
          });
          //res.render('chapters',{bookName:fbook.bookname, authName:fbook.author, chapNo:fbook.chapters, bookid:fbook._id});
        }
      });
    }
  });
});

app.post("/allnotes",function(req,res){
  Review.find({username:usname, bookname:req.body.bookname}).sort({ chapterno : 'ascending'}).exec(function(err, result){
    if(err){
      console.log(err);
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

app.post("/deleterev",function(req,res){
  Review.deleteOne({_id:req.body.button},function(err){
    if(err){
      console.log(err);
    }
    else{
      res.redirect("/homepage");
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
