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
import findOrCreate from "mongoose-findorcreate";
import strategy from "passport-google-oauth20";
const GoogleStrategy = strategy.Strategy;

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

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema =  new Schema({
    email : String,
    password : String,
    googleId : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/',(req,res)=>{
    res.render('home');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
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