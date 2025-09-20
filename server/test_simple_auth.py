#!/usr/bin/env python3
"""
Simple authentication test without full system dependencies
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_basic_auth():
    """Test basic authentication functionality"""
    print("🚀 Testing Basic Authentication")
    print("=" * 50)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print("✅ Server is running")
    except Exception as e:
        print(f"❌ Server not running: {e}")
        return
    
    # Test registration
    print("\\n📝 Testing User Registration")
    user_data = {
        "username": "testuser",
        "email": "test@example.com", 
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
    print(f"Registration response: {response.status_code}")
    
    if response.status_code == 201:
        result = response.json()
        token = result['token']
        print(f"✅ Registration successful! Token: {token[:20]}...")
        
        # Test login
        print("\\n🔐 Testing User Login")
        login_data = {
            "username": "testuser",
            "password": "password123"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"Login response: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            token = result['token']
            print(f"✅ Login successful! Token: {token[:20]}...")
            
            # Test token verification
            print("\\n🔍 Testing Token Verification")
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(f"{BASE_URL}/api/auth/verify", headers=headers)
            print(f"Token verification response: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Token verification successful!")
                
                # Test protected endpoint access
                print("\\n🛡️ Testing Protected Endpoint Access")
                chat_data = {"message": "Hello, this is a test"}
                response = requests.post(f"{BASE_URL}/api/chat", json=chat_data, headers=headers)
                print(f"Protected chat response: {response.status_code}")
                
                if response.status_code == 200:
                    print("✅ Protected endpoint access successful!")
                else:
                    print(f"❌ Protected endpoint failed: {response.text}")
                
                # Test access without token
                print("\\n🚫 Testing Access Without Token")
                response = requests.post(f"{BASE_URL}/api/chat", json=chat_data)
                print(f"Unprotected access response: {response.status_code}")
                
                if response.status_code == 401:
                    print("✅ Unprotected access properly rejected!")
                else:
                    print(f"⚠️ Unprotected access not properly blocked: {response.status_code}")
                    
            else:
                print(f"❌ Token verification failed: {response.text}")
        else:
            print(f"❌ Login failed: {response.text}")
    else:
        print(f"❌ Registration failed: {response.text}")
    
    print("\\n🎉 Basic authentication test completed!")

if __name__ == "__main__":
    test_basic_auth()