import requests
from bs4 import BeautifulSoup

url = 'https://incois.gov.in/oceanservices/mhw/index.jsp'
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

# Example: Extracting all links
for link in soup.find_all('a'):
    print(link.get('href'))
