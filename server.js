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
mongoose.connect("mongodb://localhost/log_reg");
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
                    res.render("main");
                }
            })
                .catch(error => {
                    console.log("oops! something went wrong", error);
                    req.flash("user", error.message);
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
                    res.render("main");
                })
                .catch(error => {
                    console.log("oops! something went wrong", error);
                    req.flash("user", error.message);
                    res.redirect("/");
                });

        }
    });
});



// port
app.listen(5000, function () {
    console.log("listening on port 5000");
});