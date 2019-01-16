DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    sig TEXT NOT NULL CHECK (sig <> ''),
    user_id INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- --remember to check if there is the same culumsn name and change it if EXISTS
-- SELECT s.*, a.name AS singer_name --AS to change the name
-- FROM songs AS s
-- LEFT JOIN sigers AS a
-- ON singer.id = songs.singer_id
-- WHERE songs.singer_id = 2;
--
-- LEFT OUTER JOIN
--
-- LEFT JOIN
-- get all data from left table, if there is no data in the right table = null, nothing
--
-- FROM songs
-- FULL OUTER JOIN singers
--
-- inner join is the dath in both tables available
--
-- joining are to get data out not delet or update
--
-- no way to insert to two tables at ones
--
-- on albums.id = songs.album_id;
