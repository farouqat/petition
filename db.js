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
module.exports.getSigners = function() {
    return db.query(
        `SELECT first, last, age, city
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id`
    );
};

module.exports.registerUser = (first, last, email, hash)=>{
    return db.query(
        "INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
        [first, last, email, hash]
    );
};

module.exports.addUsersInfo = (age, city, website, infoid) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, website, user_id) VALUES ($1, $2, $3, $4) RETURNING *`, [age, city, website, infoid]
    );
};
module.exports.getUserInfo = (id) => {
    return db.query(
        `SELECT * FROM users LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE users.id = $1`, [id]
    );
};

module.exports.updateProfile1 = (first, last, email, hash, id) => {
    return db.query(
        `UPDATE users
        SET
        first = $1,
        last = $2,
        email = $3,
        password = $4
        WHERE id = $5`, [first, last, email, hash, id]
    );
};


module.exports.updateProfile2 = (age, city, website, id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, website, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $1, city = $2, website = $3
        WHERE user_profiles.user_id = $4`, [age, city, website, id]
    );
};


module.exports.getSupportersFromCity = (city) => {
    return db.query(
        `SELECT first, last, age, city
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id
        WHERE LOWER(city) = LOWER($1)`, [city]
    );
};








//
// where LOWER(city) = LOWER($1;)
//
//
//
// sign.id as use.id
