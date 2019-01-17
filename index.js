const express = require("express");
const hb = require("express-handlebars");
const app = express();
const db = require("./db");
const cookieSession = require("cookie-session");
const bcrypt = require("./bcrypt.js");
const csrf = require("csurf");

app.disable("x-powered-by");

const requireLoggedOutUser = (req, res, next) => {
    if (req.session.id) {
        console.log("1");
        return res.redirect("/petition");
    } else {
        next();
    }
};
const requireSignature = (req, res, next) => {
    if (!req.session.sigid) {
        console.log("2");
        return res.redirect("/petition");
    } else {
        next();
    }
};
const requireNoSignature = (req, res, next) => {
    if (req.session.sigid) {
        return res.redirect("/thankyou");
    } else {
        next();
    }
};
app.use(
    require("body-parser").urlencoded({
        extended: false
    })
);
app.use(express.static(__dirname + "/public"));

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(function(req, res, next) {
    if (!req.session.id && req.url != "/register" && req.url != "/login") {
        res.redirect("/register");
    } else {
        next();
    }
});

app.engine("handlebars", hb());

app.set("view engine", "handlebars");

app.use(require("body-parser").urlencoded({ extended: false }));

app.use(csrf());

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    res.setHeader("X-Frame-Options", "DENY");
    next();
});

app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res) {
    res.redirect("/register");
});

app.get("/register", requireLoggedOutUser, function(req, res) {
    res.render("registerTemplate", {
        layout: "main"
    });
});

app.post("/register", function(req, res) {
    if (
        !req.body.first ||
        !req.body.last ||
        !req.body.email ||
        !req.body.password
    ) {
        res.render("registerTemplate", {
            // csrfToken: req.csrfToken(),
            layout: "main",
            error: "Uh Oh, Seems like something went wrong. Please try again!"
        });
    } else {
        bcrypt
            .hashPassword(req.body.password)
            .then(function(hash) {
                return db.registerUser(
                    req.body.first,
                    req.body.last,
                    req.body.email,
                    hash
                );
            })
            .then(data => {
                req.session = {
                    first: data.rows[0].first,
                    last: data.rows[0].last,
                    id: data.rows[0].id
                };
                res.redirect("/userinfo");
            })
            .catch(function(err) {
                console.log("ERROR", err);
                res.render("registerTemplate", {
                    layout: "main",
                    error: "This user already exists!"
                });
            });
    }
});
///////////////// it's taking me to the sign even if ive signed///////////////////////////////////

app.get("/userinfo", (req, res) => {
    res.render("userinfoTemplate", {
        layout: "main"
    });
});
app.post("/userinfo", (req, res) => {
    db.addUsersInfo(
        req.body.age,
        req.body.city,
        req.body.website,
        req.session.id
    ).then(res.redirect("/petition"));
});

app.get("/login", requireLoggedOutUser, requireNoSignature, (req, res) => {
    res.render("loginTemplate", {
        layout: "main"
    });
});

app.post("/login", requireLoggedOutUser, (req, res) => {
    if (!req.body.email || !req.body.password) {
        res.render("loginTemplate", {
            layout: "main",
            error: "error"
        });
    } else {
        db.getUserInfoByEmail(req.body.email).then(result => {
            const data = result.rows[0];
            console.log(data);
            if (data) {
                return bcrypt
                    .checkPassword(req.body.password, data.password)
                    .then(function(doesMatch) {
                        if (doesMatch) {
                            req.session = {
                                first: data.first,
                                last: data.last,
                                id: data.id,
                                sigid: data.sigid
                            };
                            res.redirect("/petition");
                        } else {
                            res.render("loginTemplate", {
                                layout: "main",
                                error:
                                    "Sorry, your password was incorrect. Please double-check your password."
                            });
                        }
                    });
            } else {
                res.render("loginTemplate", {
                    layout: "main",
                    error:
                        "Sorry, your email was incorrect. Please double-check your email."
                });
            }
        });
    }
});

app.get("/petition", requireNoSignature, (req, res) => {
    res.render("mainTemplate", {
        layout: "main"
    });
});

app.post("/petition", requireNoSignature, (req, res) => {
    db.addSignature(req.body.sig, req.session.id)
        .then(function(result) {
            req.session.sigid = result.rows[0].id;
            res.redirect("/thankyou");
        })
        .catch(function(err) {
            console.log("err", err);
            res.render("mainTemplate", {
                error: true,
                layout: "main"
            });
        });
});

app.get("/thankyou", requireSignature, (req, res) => {
    res.render("thankyouTemplate", {
        layout: "main"
    });
});

app.get("/thankyou", requireSignature, (req, res) => {
    if (req.session.sigid) {
        db.getSignature(req.session.signatureId.rows[0].id)
            .then(function(sig) {
                res.render("thankyouTemplate", {
                    signature: sig.rows[0].sig,
                    layout: "main"
                });
            })
            .catch(function(err) {
                console.log(err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers", (req, res) => {
    db.getSigners().then(function(signers) {
        console.log(signers);
        res.render("signersTemplate", {
            signers: signers.rows,
            layout: "main"
        });
    });
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/login");
});

app.get("/updateprofile", (req, res) => {
    db.getUserInfo(req.session.id).then((results) => {
        res.render("updateProfileTemplate", {
            layout: "main",
            userinfo: results.rows[0]
        });
    });
});

app.post("/updateprofile", (req, res) => {
    bcrypt
        .hashPassword(req.body.password)
        .then(function(newHash) {
            console.log(newHash);
            db.updateProfile1(
                req.body.first,
                req.body.last,
                req.body.email,
                newHash,
                req.session.id
            );
        })
        .then(
            db.updateProfile2(
                req.body.age,
                req.body.city,
                req.body.website,
                req.session.id
            )
        );
    console.log("the new age", req.body.age);
    res.redirect("/updateprofile");
});

app.get("/signers/:city", (req, res) => {
    const city = req.params.city;
    db.getSupportersFromCity(city).then((results) => {
        console.log("results", results);
        res.render("cityTemplate", {
            layout: "main",
            userinfo: results.rows[0]
        });
    });
});




// req.session.userid = id;
app.listen(8080, () => console.log("Listening!"));
