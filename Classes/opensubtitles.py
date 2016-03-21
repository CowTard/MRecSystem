import xmlrpc.client
import requests
import os
import zipfile

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
        os.makedirs('subtitles/' + movie_name.replace(' ', '-'), exist_ok=True)

        with open('subtitles/' + movie_name.replace(' ', '-') + '.zip', 'wb') as compressed_file:
            compressed_file.write(r.content)
            compressed_file.close()

        try:
            z = zipfile.ZipFile('subtitles/' + movie_name.replace(' ', '-') + '.zip')
            z.extractall(path='subtitles/' + movie_name.replace(' ', '-') + '/')
            print('> ' + movie_name + '\'s subtitle(s) was downloaded and extracted.')
            return True
        except zipfile.BadZipFile:
            print('> ERROR ' + movie_name + '\'s subtitle(s) was NOT downloaded and extracted.')
            return False
