# bcrypt 4.x compatibility shim for passlib 1.7.4
import bcrypt as _bcrypt
if not hasattr(_bcrypt, '__about__'):
    _bcrypt.__about__ = type('', (), {'__version__': _bcrypt.__version__})()
