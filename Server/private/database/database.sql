
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS ratingfunction CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP FUNCTION IF EXISTS insert_rating() CASCADE;
DROP TRIGGER IF EXISTS create_rating_row on users CASCADE;

-- User table
CREATE TABLE users (
	id BIGSERIAL PRIMARY KEY,
	email VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL
);

-- Rating function table
CREATE TABLE ratingfunction (
	id BIGSERIAL PRIMARY KEY,
	userid BIGINT REFERENCES users(id),
	actors DECIMAL NOT NULL,
	directors DECIMAL NOT NULL,
	genre DECIMAL NOT NULL,
	idleTime DECIMAL NOT NULL,
	rated DECIMAL NOT NULL,
	runtime DECIMAL NOT NULL,
	talktime DECIMAL NOT NULL,
	timeToRead DECIMAL NOT NULL,
	year DECIMAL NOT NULL,
	imdbrating DECIMAL NOT NULL
);

-- Movie table
CREATE TABLE movies(
	id BIGSERIAL PRIMARY KEY,
	actors VARCHAR(255) NOT NULL,
	directors VARCHAR(255) NOT NULL,
	genre VARCHAR(255) NOT NULL,
	idleTime SMALLINT NOT NULL,
	rated VARCHAR(10) NOT NULL,
	runtime SMALLINT NOT NULL,
	talktime SMALLINT NOT NULL,
	timeToRead SMALLINT NOT NULL,
	year VARCHAR(10) NOT NULL,
	imdbrating SMALLINT NOT NULL,
	poster VARCHAR(255) NOT NULL
);

-- predictions
CREATE TABLE predictions(
	movieID BIGINT REFERENCES movies(id),
	userID BIGINT REFERENCES users(id),
	rating SMALLINT NOT NULL,
	PRIMARY KEY(movieID,userID)
);

-- Function
CREATE FUNCTION insert_rating() RETURNS Trigger as $create_rating_row$
	DECLARE
		_temp numeric;
	BEGIN
		select currval(pg_get_serial_sequence('users','id')) INTO _temp;
		INSERT INTO ratingfunction (userid,actors,directors, genre, idleTime, rated, runtime, talktime, timeToRead, year, imdbrating) VALUES (_temp,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1);
		RETURN NULL;
	END;
$create_rating_row$ LANGUAGE plpgsql;	

-- Trigger
CREATE TRIGGER create_rating_row AFTER INSERT ON users
	FOR ROW 
	EXECUTE PROCEDURE insert_rating();
