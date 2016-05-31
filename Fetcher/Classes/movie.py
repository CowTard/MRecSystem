import os
import pysrt
import datetime
import re


class Movie:

    def __init__(self, title, id, year, rated, runtime, genre, director, actors, poster, imdbrating, writer):
        self.title = title
        self.id = id
        self.year = year
        self.rated = rated
        self.runtime = runtime
        self.genre = genre
        self.director = director
        self.actors = actors
        self.poster = poster
        self.imdbRating = imdbrating
        self.talkTime = 0
        self.idleTime = 0
        self.writer = writer

    # Get subtitles for this movie object.
    def get_str_files(self):
        str_files = []

        for file in os.listdir('Subtitles/' + self.title.replace(' ', '-')):
            if file.endswith(".srt"):
                str_files.append(file)

        if len(str_files) == 0:
            print(self.title + " - No str files here . Ups.")
        return str_files

    # Retrieve data from subtitles
    def retrieve_data(self):

        subtitles_file = self.get_str_files()

        for sub_file in subtitles_file:
            sub = pysrt.open('Subtitles/' + self.title.replace(' ', '-') + '/' + sub_file, encoding='iso-8859-1')
            for line in sub:
                time_difference_in_minutes = datetime.datetime.combine(datetime.date.today(), line.end.to_time()) - \
                                             datetime.datetime.combine(datetime.date.today(), line.start.to_time())
                self.talkTime += time_difference_in_minutes.total_seconds()
        
        self.convert_runtime()
        self.talkTime = round(self.talkTime / 60);
        self.idleTime = round(float(self.runtime) - (self.talkTime))

    # Convert runtime from 'X min' => 'X'
    def convert_runtime(self):
        self.runtime = re.sub('\D','',self.runtime)
