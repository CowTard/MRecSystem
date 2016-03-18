
# Script to get top250 imdb movies

from lxml import html
import requests
from Classes import movie


# Request IMDB page and parse the results
def get_page():
    page = requests.get('http://m.imdb.com/chart/top')
    tree = html.fromstring(page.content)

    # Parse the imdb page searching for the movie names and the their id
    movies_name = tree.xpath('//span[@class="media-body media-vertical-align"]//h4//text()[2]')
    movies_id = tree.xpath('//a[@class="btn-full"]//@href')

    # Creating movie object and store it in an array
    movie_id_list = parse_id(movies_id)

    movies = request_extra_info(movies_name, movie_id_list)

    return movies


# Function to call omdbapi so we get full information on a certain movie
def request_extra_info(movies_name, movie_id_list):

    movies_objects = []

    for i in range(len(movies_name)):
        r = requests.get('http://www.omdbapi.com/?r=json&plot=short&i=' + movie_id_list[i])
        json_variables = r.json()
        movies_objects.append(movie.Movie(movies_name[i], movie_id_list[i], json_variables['Year'],
                                          json_variables['Rated'], json_variables['Runtime'],
                                          json_variables['Genre'], json_variables['Director'],
                                          json_variables['Actors'], json_variables['Country'], json_variables['Poster'],
                                          json_variables['Metascore'], json_variables['imdbRating']))
    return movies_objects


# Function to parse all ID
def parse_id(movies_id):
    movie_id_list = []

    for movieID in movies_id:
        movie_id_list.append(movieID.split('/')[2])

    return movie_id_list


# Start script
def init():
    movies = get_page()
    for movieObj in movies:
        movieObj.print()

init()
