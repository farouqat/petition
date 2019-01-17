drop table if exists user_profiles;

CREATE TABLE user_profiles(
    id serial primary key,
    age INT,
    city VARCHAR(100),
    website VARCHAR(400),
    user_id INT REFERENCES users(id) NOT NULL UNIQUE
);
