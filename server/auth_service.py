"""
Authentication utilities for user management and JWT token handling
"""
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from pymongo import MongoClient
import os
import logging

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self):
        """Initialize authentication service with MongoDB connection"""
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        self.db_name = os.getenv('MONGODB_DB_NAME', 'educational_ai')
        self.users_collection_name = 'users'
        
        # Initialize MongoDB connection
        try:
            self.client = MongoClient(self.mongodb_uri)
            self.db = self.client[self.db_name]
            self.users_collection = self.db[self.users_collection_name]
            
            # Create unique index on username and email
            self.users_collection.create_index("username", unique=True)
            self.users_collection.create_index("email", unique=True)
            
            logger.info("AuthService initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AuthService: {e}")
            raise

    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        try:
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
            return hashed.decode('utf-8')
        except Exception as e:
            logger.error(f"Error hashing password: {e}")
            raise

    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception as e:
            logger.error(f"Error verifying password: {e}")
            return False

    def generate_token(self, user_id: str, username: str) -> str:
        """Generate JWT token for user"""
        try:
            payload = {
                'user_id': user_id,
                'username': username,
                'exp': datetime.utcnow() + timedelta(hours=24),  # Token expires in 24 hours
                'iat': datetime.utcnow()
            }
            
            secret_key = current_app.config['SECRET_KEY']
            token = jwt.encode(payload, secret_key, algorithm='HS256')
            return token
        except Exception as e:
            logger.error(f"Error generating token: {e}")
            raise

    def decode_token(self, token: str) -> dict:
        """Decode and validate JWT token"""
        try:
            secret_key = current_app.config['SECRET_KEY']
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return None
        except Exception as e:
            logger.error(f"Error decoding token: {e}")
            return None

    def register_user(self, username: str, email: str, password: str) -> dict:
        """Register a new user"""
        try:
            # Validate input
            if not username or not email or not password:
                return {'success': False, 'message': 'All fields are required'}
            
            if len(password) < 6:
                return {'success': False, 'message': 'Password must be at least 6 characters long'}
            
            # Check if user already exists
            existing_user = self.users_collection.find_one({
                '$or': [{'username': username}, {'email': email}]
            })
            
            if existing_user:
                if existing_user['username'] == username:
                    return {'success': False, 'message': 'Username already exists'}
                else:
                    return {'success': False, 'message': 'Email already exists'}
            
            # Hash password and create user
            hashed_password = self.hash_password(password)
            user_data = {
                'username': username,
                'email': email,
                'password': hashed_password,
                'created_at': datetime.utcnow(),
                'last_login': None
            }
            
            result = self.users_collection.insert_one(user_data)
            user_id = str(result.inserted_id)
            
            # Generate token
            token = self.generate_token(user_id, username)
            
            return {
                'success': True,
                'message': 'User registered successfully',
                'token': token,
                'user': {
                    'id': user_id,
                    'username': username,
                    'email': email
                }
            }
            
        except Exception as e:
            logger.error(f"Error registering user: {e}")
            return {'success': False, 'message': 'Registration failed'}

    def login_user(self, email: str, password: str) -> dict:
        """Authenticate user and return token"""
        try:
            # Find user by username or email
            user = self.users_collection.find_one({
                '$or': [{'username': email}, {'email': email}]
            })
            
            if not user:
                return {'success': False, 'message': 'Invalid credentials'}
            
            # Verify password
            if not self.verify_password(password, user['password']):
                return {'success': False, 'message': 'Invalid credentials'}
            
            # Update last login
            self.users_collection.update_one(
                {'_id': user['_id']},
                {'$set': {'last_login': datetime.utcnow()}}
            )
            
            # Generate token
            user_id = str(user['_id'])
            token = self.generate_token(user_id, user['username'])
            
            return {
                'success': True,
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': user_id,
                    'username': user['username'],
                    'email': user['email']
                }
            }
            
        except Exception as e:
            logger.error(f"Error logging in user: {e}")
            return {'success': False, 'message': 'Login failed'}

    def get_user_by_id(self, user_id: str) -> dict:
        """Get user information by ID"""
        try:
            from bson import ObjectId
            user = self.users_collection.find_one({'_id': ObjectId(user_id)})
            
            if user:
                return {
                    'id': str(user['_id']),
                    'username': user['username'],
                    'email': user['email'],
                    'created_at': user['created_at'],
                    'last_login': user.get('last_login')
                }
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None

# Authentication decorator
def require_auth(f):
    """Decorator to require authentication for endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import g
        
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No authorization header provided'}), 401
        
        try:
            # Extract token from "Bearer <token>" format
            token = auth_header.split(' ')[1] if auth_header.startswith('Bearer ') else auth_header
        except IndexError:
            return jsonify({'error': 'Invalid authorization header format'}), 401
        
        # Initialize auth service and decode token
        auth_service = AuthService()
        payload = auth_service.decode_token(token)
        
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user info to both request and Flask's g for use in endpoints
        request.current_user = {
            'user_id': payload['user_id'],
            'username': payload['username']
        }
        
        # Also set in Flask's g object
        g.user_id = payload['user_id']
        g.username = payload['username']
        
        return f(*args, **kwargs)
    
    return decorated_function

# Initialize global auth service instance
auth_service = None

def get_auth_service():
    """Get or create auth service instance"""
    global auth_service
    if auth_service is None:
        auth_service = AuthService()
    return auth_service