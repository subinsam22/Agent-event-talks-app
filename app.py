import xml.etree.ElementTree as ET
import urllib.request
import urllib.error
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        req = urllib.request.Request(
            FEED_URL,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns)
            title_text = title.text if title is not None else 'Unknown Date'
            
            updated = entry.find('atom:updated', ns)
            updated_text = updated.text if updated is not None else ''
            
            link_elem = entry.find('atom:link[@rel="alternate"]', ns)
            if link_elem is None:
                link_elem = entry.find('atom:link', ns)
            link_text = link_elem.attrib.get('href', '') if link_elem is not None else ''
            
            content_elem = entry.find('atom:content', ns)
            content_text = content_elem.text if content_elem is not None else ''
            
            # Make sure ID exists
            id_elem = entry.find('atom:id', ns)
            id_text = id_elem.text if id_elem is not None else title_text
            
            entries.append({
                'id': id_text,
                'title': title_text,
                'updated': updated_text,
                'link': link_text,
                'content': content_text
            })
            
        return {
            'success': True,
            'entries': entries
        }
    except urllib.error.URLError as e:
        return {
            'success': False,
            'error': f"Network error: {str(e)}"
        }
    except ET.ParseError as e:
        return {
            'success': False,
            'error': f"XML Parsing error: {str(e)}"
        }
    except Exception as e:
        return {
            'success': False,
            'error': f"An unexpected error occurred: {str(e)}"
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    data = fetch_and_parse_feed()
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
