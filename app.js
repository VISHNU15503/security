import dotenv from "dotenv";
dotenv.config();
import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import {Schema, model} from "mongoose";
import bcrypt from "bcrypt";

const saltRounds = 10;

const app = express();
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema =  new Schema({
    email : String,
    password : String
});

const User = new model("User",userSchema);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.get('/',(req,res)=>{
    res.render('home');
});

app.get('/login',(req,res)=>{
    res.render('login');
});

app.get('/register',(req,res)=>{
    res.render('register');
});

app.post('/register', async (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    bcrypt.hash(password, saltRounds).then(async function(hash) {
        // Store hash in your password DB.
        const newUser = {
            email : username,
            password : hash
        };
        await User.create(newUser).then((val)=>{
            console.log("New user added to the database...");
            res.render('secrets');
            return;
        }).catch((err)=>{
            console.log(err);
            res.send("Error occured while adding the user to the database!!!");
            return;
        });
    });
});

app.post('/login', async (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    await User.findOne({email:username}).then((val)=>{
        if(val){
            bcrypt.compare(password, val.password).then(function(result) {
                if(result === true) res.render('secrets');
                else res.send("Wrong password!!!");
            });
        }else{
            res.send("User not found!!!");
            return;
        }
    }).catch((err)=>{
        console.log(err);
        return;
    });
});

app.listen(3000,()=>{
    console.log("Server started on the PORT 3000...");
})