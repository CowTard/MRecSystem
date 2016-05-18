import json
import os
import xmlrpc.client
import zipfile
import shutil

import requests


# Class responsible for handling the connection with OpenSubtitles API
class OpenSubtitles:
    def __init__(self):

        _secrets = json.loads(open('Developer/secrets.json').read())

        self.server = xmlrpc.client.ServerProxy('https://api.opensubtitles.org/xml-rpc')
        self.language = 'eng'
        self.nickname = _secrets['nickname']
        self.password = _secrets['password']
        self.userAgent = _secrets['userAgent']
        self.token = ''

        os.makedirs('Subtitles/', exist_ok=True)

    def login(self):
        data = self.server.LogIn(self.nickname, self.password, self.language, self.userAgent)
        self.token = data['token']

    def search_subtitle(self, imdb, movie_name):
        search = self.server.SearchSubtitles(self.token, [{'sublanguageid': self.language, 'imdbid': imdb}])

        download_links = []
        for subtitles in search['data']:
            download_links.append(subtitles['ZipDownloadLink'])

        for subtitles_link in download_links:
            if self.download_store_subtitle(movie_name, subtitles_link):
                break
            else:
                continue

    def download_store_subtitle(self, movie_name, str_link):
        r = requests.get(str_link)
        os.makedirs('Subtitles/' + movie_name.replace(' ', '-'), exist_ok=True)

        with open('Subtitles/' + movie_name.replace(' ', '-') + '.zip', 'wb') as compressed_file:
            compressed_file.write(r.content)
            compressed_file.close()

        r.close()

        try:
            z = zipfile.ZipFile('Subtitles/' + movie_name.replace(' ', '-') + '.zip')
            z.extractall(path='Subtitles/' + movie_name.replace(' ', '-') + '/')
            z.close()
            os.remove('Subtitles/' + movie_name.replace(' ', '-') + '.zip')

            subtitles_count = 0
            for file in os.listdir('Subtitles/' + movie_name.replace(' ', '-')):
                if file.endswith(".srt"):
                    subtitles_count += 1

            if subtitles_count == 0:
                shutil.rmtree('Subtitles/' + movie_name.replace(' ', '-'))
                print('> ERROR ' + movie_name + ': Too much subtitles or none.')
                return False

            print('> ' + movie_name + '\'s subtitle(s) was downloaded and extracted.')
            return True
        except zipfile.BadZipFile:
            print('> ERROR ' + movie_name + '\'s subtitle(s) was NOT downloaded and extracted.')
            return False
