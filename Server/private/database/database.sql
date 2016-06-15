
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS ratingfunction CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS movies_users CASCADE;
--DROP TABLE IF EXISTS users_similarity CASCADE;
DROP TABLE IF EXISTS bestAtributes CASCADE;
DROP FUNCTION IF EXISTS insert_rating() CASCADE;
DROP TRIGGER IF EXISTS create_rating_row on users CASCADE;

-- User table
CREATE TABLE users (
	id BIGSERIAL PRIMARY KEY,
	email VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	token VARCHAR(255) NOT NULL
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
	writers DECIMAL NOT NULL,
	year DECIMAL NOT NULL,
	imdbrating DECIMAL NOT NULL
);

-- Movie table
CREATE TABLE movies(
	id BIGSERIAL PRIMARY KEY,
	title VARCHAR(255) NOT NULL,
	actors VARCHAR(255) NOT NULL,
	directors VARCHAR(255) NOT NULL,
	genre VARCHAR(255) NOT NULL,
	idleTime SMALLINT NOT NULL,
	rated VARCHAR(10) NOT NULL,
	runtime SMALLINT NOT NULL,
	talktime SMALLINT NOT NULL,
	writers VARCHAR(500) NOT NULL,
	year VARCHAR(10) NOT NULL,
	imdbrating DECIMAL NOT NULL,
	poster VARCHAR(255) NOT NULL
);

-- Movie liked by users
CREATE TABLE movies_users(
	movieID BIGINT REFERENCES movies(id),
	userID BIGINT REFERENCES users(id),
	liked BOOLEAN,
	PRIMARY KEY (movieID, userID)
);

-- user similarity
/*
CREATE TABLE users_similarity(
	user1ID BIGINT REFERENCES users(id),
	user2ID BIGINT REFERENCES users(id),
	PRIMARY KEY (user1ID, user2ID)
);*/

-- predictions
CREATE TABLE predictions(
	movieID BIGINT REFERENCES movies(id),
	userID BIGINT REFERENCES users(id),
	rating DECIMAL NOT NULL,
	PRIMARY KEY(movieID,userID)
);

-- Best attributes 
CREATE TABLE bestAtributes(
	userID BIGINT REFERENCES users(id),
	actors VARCHAR(255) NOT NULL,
	directors VARCHAR(255) NOT NULL,
	genre VARCHAR(255) NOT NULL,
	idleTime DECIMAL NOT NULL,
	rated VARCHAR(10) NOT NULL,
	runtime DECIMAL NOT NULL,
	talktime DECIMAL NOT NULL,
	writers VARCHAR(500) NOT NULL,
	year VARCHAR(10) NOT NULL,
	imdbrating DECIMAL NOT NULL
);

-- Function
CREATE FUNCTION insert_rating() RETURNS Trigger as $create_rating_row$
	DECLARE
		_temp numeric;
		iterator float4 := 1;
	BEGIN
		select currval(pg_get_serial_sequence('users','id')) INTO _temp;
		INSERT INTO ratingfunction (userid,actors,directors, genre, idleTime, rated, runtime, talktime, writers, year, imdbrating) VALUES (_temp,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1);
		INSERT INTO bestAtributes (userid,actors,directors, genre, idleTime, rated, runtime, talktime, writers, year, imdbrating) VALUES (_temp,0,0,0,0,0,0,0,0,0,0);
		WHILE iterator < 126
	    LOOP
	    	INSERT INTO predictions (movieID, userID, rating) VALUES (iterator,_temp,0);
	    	iterator := iterator + 1;
	    END LOOP;
		RETURN NULL;
	END;
$create_rating_row$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER create_rating_row AFTER INSERT ON users
	FOR ROW 
	EXECUTE PROCEDURE insert_rating();

-- Para teste
/*
insert into predictions values('1','3','7');
insert into predictions values('2','3','1');
insert into predictions values('3','3','3');
insert into predictions values('4','3','8');
insert into predictions values('5','3','9');
insert into predictions values('6','3','9');
insert into predictions values('7','3','10');
insert into predictions values('8','3','7');
insert into predictions values('9','3','5');
insert into predictions values('10','3','8');
insert into predictions values('11','3','6');

insert into predictions values('1','1','2');
insert into predictions values('2','1','1');
insert into predictions values('3','1','3');
insert into predictions values('4','1','4');
insert into predictions values('5','1','10');
insert into predictions values('6','1','8');
insert into predictions values('7','1','7');
insert into predictions values('8','1','9');
insert into predictions values('9','1','8');
insert into predictions values('10','1','6');
insert into predictions values('11','1','10');
	*/