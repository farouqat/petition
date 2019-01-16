const spicedPg = require('spiced-pg');
const {dbUser, dbPassword} = require('./secrets');
const db = spicedPg(`postgres:${dbUser}:${dbPassword}@localhost:5432/petition`);

module.exports.addSignature = function(sig, user_id) {
    return db.query(
        `INSERT INTO signatures (sig, user_id)
        VALUES ($1, $2) returning id`,
        [sig, user_id]
    );
};
module.exports.getUserInfoByEmail = function(email){
    return db.query(`SELECT password, first, last, users.id, signatures.id AS sigid
        FROM users
        LEFT JOIN signatures
        ON users.id = signatures.user_id
        WHERE email = $1`, [email]
    );
};
module.exports.getSigners = function(sig) {
    return db.query(
        `SELECT first, last, sig
        FROM signatures`
    );
};

module.exports.registerUser = (first, last, email, hash)=>{
    return db.query(
        "INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
        [first, last, email, hash]
    );
};

//
// where LOWER(city) = LOWER($1;)
//
//
//
// sign.id as use.id
