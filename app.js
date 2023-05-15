import dotenv from "dotenv";
dotenv.config();
import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import {Schema, model} from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema =  new Schema({
    email : String,
    password : String
});

userSchema.plugin(passportLocalMongoose);

const User = new model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); 

app.get('/',(req,res)=>{
    res.render('home');
});

app.get('/login',(req,res)=>{
    res.render('login');
});

app.get('/register',(req,res)=>{
    res.render('register');
});

app.get('/secrets',(req,res)=>{
    if(req.isAuthenticated()){
        res.render('secrets');
    }
    else{
        res.redirect('/login');
    }
});

app.get('/logout',(req,res)=>{
    req.logout((err)=>{
        if (err) { 
          return next(err); 
          }
        res.redirect('/');
    });
});

app.post('/register', async (req,res)=>{

    User.register({username:req.body.username},req.body.password).then((val)=>{
        console.log(val);
        passport.authenticate("local")(req,res,()=>{
            res.redirect('/secrets');
        });
    }).catch((err)=>{
        console.log(err);
        res.redirect('/register');
    });
    
});

app.post('/login', async (req,res)=>{
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    req.login(user,(err)=>{
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect('/secrets');
            });
        }
    });

});

app.listen(3000,()=>{
    console.log("Server started on the PORT 3000...");
})