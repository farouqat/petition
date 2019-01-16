const express = require("express");
const hb = require("express-handlebars");
const app = express();
const db = require("./db");
const cookieSession = require("cookie-session");
const bcrypt = require('./bcrypt.js');
const csrf = require("csurf");


app.disable('x-powered-by');

const requireLoggedOutUser = (req, res, next) => {
    if (req.session.id){
        console.log('1');
        return res.redirect('/petition');
    } else {
        next();
    }
};
const requireSignature = (req, res, next) => {
    if (!req.session.sigid){
        console.log('2');

        return res.redirect('/petition');
    } else {
        next();
    }
};
const requireNoSignature = (req, res, next) => {
    if (req.session.sigid){
        console.log('3');
        return res.redirect('/thankyou');
    } else {
        next();
    }
};
app.use(require("body-parser").urlencoded({
    extended: false
}));
app.use(express.static(__dirname + "/public"));

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(function (req, res, next) {
    console.log("req session", req.session);
    if(!req.session.id && req.url !='/register' && req.url != '/login'){
        res.redirect('/register');
    }
    else {
        next();
    }
});



app.engine("handlebars", hb());

app.set("view engine", "handlebars");

app.use(require("body-parser").urlencoded({ extended: false }));



app.use(csrf());

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

app.use(express.static(__dirname + "/public"));



app.get('/register', function(req, res) {
    res.render('registerTemplate', {
        // csrfToken: req.csrfToken(),
        layout: 'main'
    });
});

app.post("/register", function(req, res) {

    if (
        !req.body.first ||
        !req.body.last  ||
        !req.body.email ||
        !req.body.password
    ) {
        res.render("registerTemplate", {
            // csrfToken: req.csrfToken(),
            layout: "main",
            error: "Uh Oh, Seems like something went wrong. Please try again!"
        });
    } else {
        bcrypt.hashPassword(req.body.password)
            .then(function(hash) {
                console.log("string");
                return db.registerUser(req.body.first, req.body.last, req.body.email, hash);
            })
            .then(data => {
                req.session = {
                    first: data.rows[0].first,
                    last: data.rows[0].last,
                    id: data.rows[0].id
                };
                console.log(req.session);
                res.redirect("/petition");
            })
            .catch(function(err) {
                console.log('ERROR',err);
                res.render("registerTemplate", {
                    layout: "main",
                    error: "This user already exists!"
                });
            });
    }
});
///////////////// it's taking me to the sign even if ive signed///////////////////////////////////
///////////////// signers is not workin???////////////////////////////////////////////

app.get('/login', requireLoggedOutUser, requireNoSignature ,(req, res) => {
    res.render('loginTemplate', {
        layout: 'main'
    });
});

app.post('/login', requireLoggedOutUser, (req, res) => {
    if (
        !req.body.email ||
        !req.body.password
    ) {
        res.render("loginTemplate", {
            layout: "main",
            error: "error"
        });
    } else {
        db.getUserInfoByEmail(req.body.email).then((result)=> {
            const data = result.rows[0];
            if (data) {
                return bcrypt.checkPassword(req.body.password, data.password)
                    .then(function(doesMatch){
                        console.log(data);
                        if(doesMatch){
                            req.session = {
                                first: data.first,
                                last: data.last,
                                id: data.id,
                                sigid: data.sigid
                            };
                            res.redirect('/petition');
                        } else {
                            res.render('login', {
                                layout: 'main',
                                error: 'Sorry, your password was incorrect. Please double-check your password.'
                            });
                        }
                    });
            } else {
                res.render('login', {

                    layout: 'main',
                    error: 'Sorry, your email was incorrect. Please double-check your email.'
                });
            }
        });
    }
});

app.get("/petition", (req, res) => {
    console.log('here');
    res.render("mainTemplate", {
        layout: "main"
    });
});

app.post("/petition", requireNoSignature, (req, res) => {
    db.addSignature(
        req.body.sig,
        req.session.id)
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
    //console.log("sig id in object :", req.session.signatureId.rows[0].id);
    if (req.session.sigid) {
        db.getSignature(req.session.signatureId.rows[0].id)
            .then(function(sig) {
                console.log("then: ", sig);
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

// db.signPetition(signature).the (function (id) {
//     req.session.first = "farouq";
//     req.session.signatureId = 1; // (we need to get the id that insurt query generates and put that in a cookie insted of 1)
//     console.log("req session : ", req.session);
//
// // how to get the id from the resaults and put in the coookie??!!
//
//     res.redirect('/thanks')
// })

app.get("/signers", requireSignature ,(req, res) => {
    res.render("signersTemplate", {
        layout: "main"
    });
});

app.post("/signers", requireSignature ,(req, res) => {
    db.getSigners().then(function(signers) {
        console.log("signers.rows: ", signers.rows);
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

// app.get("/thankyou", requireSignature, (req, res) => {
//     //console.log("sig id in object :", req.session.signatureId.rows[0].id);
//     if (req.session.signatureId) {
//         db.getSignature(req.session.signatureId.rows[0].id)
//             .then(function(sig) {
//                 console.log("then: ", sig);
//                 res.render("thankyouTemplate", {
//                     signature: sig.rows[0].sig,
//                     layout: "main"
//                 });
//             })
//             .catch(function(err) {
//                 console.log(err);
//             });
//     } else {
//         res.redirect("/petition");
//     }
// });


// app.send('login',requireLoggedOutUser, (req, res) => {
// // if the pass word match
// // find if signed get sig id by user id
// // then redirekt to sign
// });
// arr.get("/signers/:city")
//     const city = req.params.city;

// req.session.userid = id;
app.listen(8080, () => console.log("Listening!"));