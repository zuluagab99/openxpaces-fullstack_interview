import os
from dotenv import load_dotenv

load_dotenv()

API_KEY       = os.getenv("API_KEY", "dev-secret-key-123")
DATABASE_URL  = os.getenv("DATABASE_URL", "postgresql+pg8000://localhost/deal_intake")