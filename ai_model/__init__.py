# ai_model/__init__.py
# Kept minimal to avoid circular imports.
# ai_model/*.py files import "from models.db import get_db"
# models/__init__.py imports from ai_model.* shims
# To break the cycle: ai_model/__init__.py must NOT import from ai_model submodules.
from ai_model.db import mongo, get_db

__all__ = ['mongo', 'get_db']
