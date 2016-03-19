import xmlrpc.client
import requests
import os
import zipfile
import io


# Class responsible for handling the connection with OpenSubtitles API
class OpenSubtitles:
    def __init__(self):
        self.server = xmlrpc.client.ServerProxy('https://api.opensubtitles.org/xml-rpc')
        self.language = 'eng'
        self.userAgent = 'OSTestUserAgent'
        self.token = ''
        os.makedirs('subtitles/', exist_ok=True)

    def login(self):
        data = self.server.LogIn('', '', self.language, self.userAgent)
        self.token = data['token']

    def search_subtitle(self, imdb, movie_name):
        search = self.server.SearchSubtitles(self.token, [{'sublanguageid': self.language, 'imdbid': imdb}])
        self.download_store_subtitle(movie_name, search['data'][0]['ZipDownloadLink'])

    def download_store_subtitle(self, movie_name, str_link):
        r = requests.get(str_link)

        os.makedirs('subtitles/' + movie_name.replace(' ', '-'), exist_ok=True)

        with open('subtitles/' + movie_name.replace(' ', '-') + '.zip', 'wb') as file:
            file.write(r.content)
            file.close()

        z = zipfile.ZipFile('subtitles/' + movie_name.replace(' ', '-') + '.zip')

        if zipfile.is_zipfile(z):
            z.extractall(path='subtitles/' + movie_name.replace(' ', '-') + '/')

        print('> ' + movie_name + '\'s subtitle(s) was downloaded and extracted.')
        # Need to erase zipfiles.
