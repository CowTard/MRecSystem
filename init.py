
# Script to get top250 imdb movies

from lxml import html
import requests
from Classes import movie
from Classes import opensubtitles


# Request IMDB page and parse the results
def get_page():
    page = requests.get('http://m.imdb.com/chart/top')
    tree = html.fromstring(page.content)

    # Parse the imdb page searching for movie id
    movies_id = tree.xpath('//a[@class="btn-full"]//@href')

    # Creating movie object and store it in an array
    movie_id_list = parse_id(movies_id)

    movies = request_extra_info(movie_id_list)

    return movies


# Function to call omdbapi so we get full information on a certain movie
def request_extra_info(movie_id_list):

    movies_objects = []

    for i in range(len(movie_id_list)):
        r = requests.get('http://www.omdbapi.com/?r=json&plot=short&i=' + movie_id_list[i])
        json_variables = r.json()
        movies_objects.append(movie.Movie(json_variables['Title'], movie_id_list[i], json_variables['Year'],
                                          json_variables['Rated'], json_variables['Runtime'],
                                          json_variables['Genre'], json_variables['Director'],
                                          json_variables['Actors'], json_variables['Country'], json_variables['Poster'],
                                          json_variables['Metascore'], json_variables['imdbRating']))
        print('> Information of ' + json_variables['Title'] + ' completed.')
    return movies_objects


# Function to parse all ID
def parse_id(movies_id):
    movie_id_list = []

    for movieID in movies_id:
        movie_id_list.append(movieID.split('/')[2])

    return movie_id_list


# Start script
def init():
    print('> Starting to parse IMDB.')
    movies = get_page()
    print('> Connecting to OpenSubtitles.')

    # Downloading subtitles material
    open_subtitles = opensubtitles.OpenSubtitles()
    open_subtitles.login()

    print('> Login successful.')
    print('> Starting to download subtitles.')
    for movieObj in movies:
        open_subtitles.search_subtitle(movieObj.id[2:], movieObj.title)


init()
