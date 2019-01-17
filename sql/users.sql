drop table if exists users;

CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first VARCHAR(200) NOT NULL CHECK (first<> ''),
    last VARCHAR(200) NOT NULL CHECK (last <> ''),
    email VARCHAR(200) UNIQUE NOT NULL CHECK (email <> '') ,
    password VARCHAR(200) NOT NULL CHECK (password <> '')
);



-- req.body.first,
-- req.body.last,
-- req.body.sign
--
-- req.session.usereid;
--

--
-- SELECT signature FROM signatures WHERE user_id = $1;
