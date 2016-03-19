import jsonpickle


class Movie:

    def __init__(self, title, id, year, rated, runtime, genre, director, actors, country, poster, metascore, imdbrating):
        self.title = title
        self.id = id
        self.year = year
        self.rated = rated
        self.runtime = runtime
        self.genre = genre
        self.director = director
        self.actors = actors
        self.country = country
        self.poster = poster
        self.metascore = metascore
        self.imdbRating = imdbrating

    def print(self):
        print(jsonpickle.encode(self, unpicklable=False))
