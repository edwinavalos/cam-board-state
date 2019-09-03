from flask import render_template
from flask import Flask
from flask import request
from flask import abort
from base64 import b64decode
from flask import jsonify
from pyzbar import pyzbar
import numpy as np
import cv2
import requests


app = Flask(__name__)


class Card:
    def __init__(self, name, image_url):
        self.name = name
        self.image_url = image_url

    def serialize(self):
        return {
            'name': self.name,
            'image_url': self.image_url,
        }

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == "POST":
        type = request.form['image'].split(',')[0]
        image_data = request.form['image'].split(',')[1]
        if type != "data:image/png;base64":
            return abort(422)
        ## The AJAX post from client replaces "+" with " ", so undo that
        image_data = b64decode(image_data.replace(" ", "+"))
        barcodes = read_qr_codes(image_data=image_data)
        if barcodes:
            print "Found {} cards".format(len(barcodes))
            card_objs = gather_images(barcodes=barcodes)
            return jsonify(cards=[c.serialize() for c in card_objs])
        else:
            return jsonify("No card images found")
    return render_template("index.html", cards=None)


def read_qr_codes(image_data):
    nparr = np.fromstring(image_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    barcodes = pyzbar.decode(image)
    return barcodes


def gather_images(barcodes):
    cards = []
    for barcode in barcodes:
        url = barcode.data
        response = requests.get(url)
        if response.status_code != 200:
            print "Error loading card data"
        data = response.json()
        card = Card(name=data['name'], image_url=data['image_uris']['small'])
        cards.append(card)
    return cards



if __name__ == "__main__":
    app.run(ssl_context='adhoc')