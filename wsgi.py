import sys
import os

project_home = '/home/samanshahab/acadify/backend'
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

os.environ['MONGO_URI'] = 'mongodb+srv://Acadify_Project:acadify2026!@cluster0.9bga8h0.mongodb.net/nexus_db?retryWrites=true&w=majority&appName=Cluster0'
os.environ['SECRET_KEY'] = 'nexus-super-secret-key-2026'
os.environ['FLASK_ENV'] = 'production'
os.environ['DB_NAME'] = 'nexus_db'

from app import app as application
