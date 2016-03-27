import os


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

    # Get subtitles for this movie object.
    def get_str_files(self):
        str_files = []

        for file in os.listdir('Subtitles/' + self.title.replace(' ', '-')):
            if file.endswith(".srt"):
                str_files.append(file)

        if len(str_files) == 0:
            print(self.title + " - No str files here . Ups.")
        return str_files

