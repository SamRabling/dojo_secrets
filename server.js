const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("express-flash");
const bcrypt = require('bcrypt-as-promised');
const mongoose = require("mongoose");
var path = require("path");

// sessions
app.set('trust proxy', 1)
app.use(session({
    secret: "UnTiTlEd_(pOrTrAiT_Of_rOsS)_By_Felix_Gonzalez-Torres",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 6000 }
}));

//app use
app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./static")));
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");

// mongoose db
mongoose.connect("mongodb://localhost/secrets");
// comment schema
var CommentSchema = new mongoose.Schema({
    comment: { type: String, required: true, minlength: 10 }
},
    { timestamps: true });
mongoose.model("Comment", CommentSchema);

var Comment = mongoose.model("Comment");

// secret schema
var SecretSchema = new mongoose.Schema({
    secret: { type: String, required: true, minlength: 10 },
    comment: [CommentSchema]
},
    { timestamps: true });
mongoose.model("Secret", SecretSchema);

var Secret = mongoose.model("Secret");
 //user schema
var UserSchema = new mongoose.Schema({
    first_name: { type: String, required: true, minlenght: 2 },
    last_name: { type: String, required: true, minlenght: 2 },
    birthday: { type: Date, required: true },
    email: { type: String, unique: true, required: true, match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/] },
    password: { type: String, required: true }
    
});
var User = mongoose.model("User", UserSchema);

// routes
app.get("/", function (req, res) {
    res.render("index");
});

app.post("/users", function (req, res) {
    console.log("got info")
    var user = new User({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        birthday: req.body.birthday,
        email: req.body.email,
    });
    console.log("prossesed info")
    bcrypt.hash(req.body.password, 10)
        .then(hashed => {
            user.password = hashed;
            console.log("hashed")
            user.save(function (err, user) {
                console.log("saved")
                if (err) {
                    for (var key in err.errors) {
                        req.flash("user", err.errors[key].message);
                    }
                    res.redirect("/");
                }
                else {
                    req.session.id = user._id;
                    req.session.email = user.email;
                    console.log(user.email)
                    res.redirect("/secrets");
                }
            })
                .catch(err => {
                    console.log("oops! something went wrong", err);
                    req.flash("user", err.errors[key].message);
                    res.redirect("/");
                });
        });
});

app.post('/sessions', (req, res) => {
    console.log(" req.body: ", req.body);
    User.findOne({ email: req.body.email }, function (err, user) {
        if (err) {
            res.redirect("/");
        }
        else {
            bcrypt.compare(req.body.password, user.password)
                .then(result => {
                    req.session.id = user._id;
                    req.session.email = user.email;
                    res.redirect("/secrets");
                })
                .catch(err => {
                    console.log("oops! something went wrong", err);
                    req.flash("user", err.errors[key].message);
                    res.redirect("/");
                });

        }
    });
});
// secrets main page
app.get("/secrets", function (req, res) {
    Secret.find({}, function (err, secrets) {
        res.render("secrets", { secrets: secrets });
    });
});

// new Message
app.post("/newSecret", function (req, res) {
    console.log("new secret");
    var secret = new Secret({
        name: req.body.name,
        secret: req.body.secret,
    });
    secret.save(function (err) {
        if (err) {
            console.log("oops! something went wrong", err);
            for (var key in err.errors) {
                req.flash('secrets', err.errors[key].message);
            }
            res.redirect("/secrets");
        } else {
            console.log("successfully added a secret!");
            res.redirect("/secrets");
        }
    });
});

// new Comment
app.post("/newComment/:id", function (req, res) {
    var secret = Secret.findOne({ _id: req.params.id }, function (err, secret) {
        if (err) {
            for (var key in err.errors) {
                req.flash('comments', err.errors[key].comment);
            }
            res.redirect("/secrets");
        }
        else {
            secret.comment.push({ comment: req.body.comment });
            secret.save(function (err) {
                res.redirect("/secrets");
            });

        }
    });
});  

//show specific secret
app.get("/secret/:id", function(req, res){
    var id = req.params.id;
    Secret.findById({ _id: id }, function (err, secrets) {
        res.render("show", { secrets: secrets });
    });
});

//logout
app.get("/logout", function(req, res){
    req.session.id = null;
    req.session.email = null;
    res.redirect("/");

})


// port
app.listen(5000, function () {
    console.log("listening on port 5000");
});