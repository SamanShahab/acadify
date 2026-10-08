import sys
from app import app
from models.user import User

def create_admin():
    with app.app_context():
        email = "admin@nexus.edu"
        password = "Admin123!"
        name = "System Administrator"

        existing = User.get_by_email(email)
        if existing:
            print(f"[!] Admin user already exists: {email}")
            return

        user, err = User.create(name, email, password, role='admin')
        if err:
            print(f"[X] Failed to create admin user: {err}")
        else:
            print("==========================================")
            print("[OK] EDU Admin Account Created Successfully!")
            print(f"    Email:    {email}")
            print(f"    Password: {password}")
            print("==========================================")

if __name__ == '__main__':
    create_admin()
