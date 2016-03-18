
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
    movies = []
    movie_id_list = parse_id(movies_id)

    for i in range(len(movies_name)):
        movies.append(movie(movies_name[i], movie_id_list[i]))

    return movies


# Function to parse all ID
def parse_id(movies_id):
    movie_id_list = []

    for movieID in movies_id:
        movie_id_list.append(movieID.split('/')[2])

    return movie_id_list


# Start script
def init():
    movies = get_page()

init()
