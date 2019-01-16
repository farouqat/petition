drop table if exists user_profiles;

CREATE TABLE user_profiles(
    id serial primary key,
    age INt,
    city VARCHAR(100),
    url VARCHAR(400),
    user_id INT REFERENCES users(id) NOT NULL
);
