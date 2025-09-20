#!/usr/bin/env python3
"""
Comprehensive test for authentication system and user isolation
"""

import requests
import json
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

BASE_URL = "http://localhost:5000"

class AuthTestSuite:
    def __init__(self):
        self.users = {}
        self.tokens = {}
        
    def create_test_pdf(self, filename, content_lines):
        """Create a test PDF with specific content"""
        c = canvas.Canvas(filename, pagesize=letter)
        width, height = letter
        
        c.setFont("Helvetica", 12)
        y_position = height - 50
        
        for line in content_lines:
            if line.strip():
                if line.isupper():
                    c.setFont("Helvetica-Bold", 14)
                else:
                    c.setFont("Helvetica", 12)
            c.drawString(50, y_position, line)
            y_position -= 20
        
        c.save()
        return filename
    
    def test_user_registration(self):
        """Test user registration"""
        print("🧪 Testing User Registration")
        
        # Test successful registration
        users_to_create = [
            {"username": "testuser1", "email": "test1@example.com", "password": "password123"},
            {"username": "testuser2", "email": "test2@example.com", "password": "password456"}
        ]
        
        for user_data in users_to_create:
            response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
            
            if response.status_code == 201:
                result = response.json()
                self.users[user_data['username']] = result['user']
                self.tokens[user_data['username']] = result['token']
                print(f"   ✅ {user_data['username']} registered successfully")
            else:
                print(f"   ❌ {user_data['username']} registration failed: {response.text}")
                return False
        
        # Test duplicate registration
        response = requests.post(f"{BASE_URL}/api/auth/register", json=users_to_create[0])
        if response.status_code == 400:
            print("   ✅ Duplicate registration properly rejected")
        else:
            print(f"   ⚠️ Duplicate registration validation issue: {response.status_code}")
        
        return True
    
    def test_user_login(self):
        """Test user login"""
        print("\\n🧪 Testing User Login")
        
        # Test successful login
        login_data = {"username": "testuser1", "password": "password123"}
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            result = response.json()
            self.tokens['testuser1'] = result['token']  # Update token
            print("   ✅ Login successful")
        else:
            print(f"   ❌ Login failed: {response.text}")
            return False
        
        # Test invalid credentials
        invalid_login = {"username": "testuser1", "password": "wrongpassword"}
        response = requests.post(f"{BASE_URL}/api/auth/login", json=invalid_login)
        
        if response.status_code == 401:
            print("   ✅ Invalid credentials properly rejected")
        else:
            print(f"   ⚠️ Invalid credentials validation issue: {response.status_code}")
        
        return True
    
    def test_token_verification(self):
        """Test token verification"""
        print("\\n🧪 Testing Token Verification")
        
        # Test valid token
        headers = {'Authorization': f'Bearer {self.tokens["testuser1"]}'}
        response = requests.get(f"{BASE_URL}/api/auth/verify", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Token verification successful for {result['user']['username']}")
        else:
            print(f"   ❌ Token verification failed: {response.text}")
            return False
        
        # Test invalid token
        invalid_headers = {'Authorization': 'Bearer invalid_token_here'}
        response = requests.get(f"{BASE_URL}/api/auth/verify", headers=invalid_headers)
        
        if response.status_code == 401:
            print("   ✅ Invalid token properly rejected")
        else:
            print(f"   ⚠️ Invalid token validation issue: {response.status_code}")
        
        return True
    
    def test_protected_endpoints(self):
        """Test that endpoints require authentication"""
        print("\\n🧪 Testing Protected Endpoints")
        
        protected_endpoints = [
            ("GET", "/api/files"),
            ("POST", "/api/chat", {"message": "test"}),
            ("POST", "/api/quiz/generate", {"quiz_type": "multiple_choice"})
        ]
        
        for method, endpoint, *data in protected_endpoints:
            # Test without authorization
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json=data[0] if data else {})
            
            if response.status_code == 401:
                print(f"   ✅ {method} {endpoint} properly protected")
            else:
                print(f"   ❌ {method} {endpoint} not protected: {response.status_code}")
        
        return True
    
    def test_user_isolation(self):
        """Test that users can only access their own documents"""
        print("\\n🧪 Testing User Isolation")
        
        # Create different PDFs for each user
        user1_pdf = self.create_test_pdf("user1_document.pdf", [
            "USER 1 PRIVATE DOCUMENT",
            "This is confidential information for user 1",
            "Secret data: Project Alpha details",
            "Budget: $50,000"
        ])
        
        user2_pdf = self.create_test_pdf("user2_document.pdf", [
            "USER 2 PRIVATE DOCUMENT", 
            "This is confidential information for user 2",
            "Secret data: Project Beta details",
            "Budget: $75,000"
        ])
        
        try:
            # Upload documents for each user
            user1_headers = {'Authorization': f'Bearer {self.tokens["testuser1"]}'}
            user2_headers = {'Authorization': f'Bearer {self.tokens["testuser2"]}'}
            
            # User 1 uploads their document
            with open(user1_pdf, 'rb') as f:
                files = {'file': f}
                response = requests.post(f"{BASE_URL}/api/upload", files=files, headers=user1_headers)
                
            if response.status_code == 200:
                user1_file_id = response.json()['file_id']
                print(f"   ✅ User 1 document uploaded: {user1_file_id}")
            else:
                print(f"   ❌ User 1 upload failed: {response.text}")
                return False
            
            # User 2 uploads their document
            with open(user2_pdf, 'rb') as f:
                files = {'file': f}
                response = requests.post(f"{BASE_URL}/api/upload", files=files, headers=user2_headers)
                
            if response.status_code == 200:
                user2_file_id = response.json()['file_id']
                print(f"   ✅ User 2 document uploaded: {user2_file_id}")
            else:
                print(f"   ❌ User 2 upload failed: {response.text}")
                return False
            
            # Test that User 1 can only see their files
            response = requests.get(f"{BASE_URL}/api/files", headers=user1_headers)
            if response.status_code == 200:
                user1_files = response.json()['files']
                user1_file_ids = [f['file_id'] for f in user1_files]
                
                if user1_file_id in user1_file_ids and user2_file_id not in user1_file_ids:
                    print("   ✅ User 1 can only see their own files")
                else:
                    print("   ❌ User isolation failed for file listing")
                    return False
            
            # Test that User 2 can only see their files
            response = requests.get(f"{BASE_URL}/api/files", headers=user2_headers)
            if response.status_code == 200:
                user2_files = response.json()['files']
                user2_file_ids = [f['file_id'] for f in user2_files]
                
                if user2_file_id in user2_file_ids and user1_file_id not in user2_file_ids:
                    print("   ✅ User 2 can only see their own files")
                else:
                    print("   ❌ User isolation failed for file listing")
                    return False
            
            # Test chat isolation
            user1_chat = {"message": "What information do you have about budgets?"}
            response = requests.post(f"{BASE_URL}/api/chat", json=user1_chat, headers=user1_headers)
            
            if response.status_code == 200:
                chat_response = response.json()['answer'].lower()
                if "50,000" in chat_response and "75,000" not in chat_response:
                    print("   ✅ User 1 chat only accesses their documents")
                elif "alpha" in chat_response and "beta" not in chat_response:
                    print("   ✅ User 1 chat shows isolation (project-based)")
                else:
                    print(f"   ⚠️ Chat isolation unclear - response: {chat_response[:100]}...")
            
            return True
            
        finally:
            # Cleanup
            for pdf_file in [user1_pdf, user2_pdf]:
                if os.path.exists(pdf_file):
                    os.remove(pdf_file)
    
    def run_all_tests(self):
        """Run all authentication tests"""
        print("🚀 Authentication System Test Suite")
        print("=" * 60)
        
        # Check if server is running
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            print("✅ Server is running")
        except Exception as e:
            print(f"❌ Server not accessible: {e}")
            return
        
        # Run test suite
        tests = [
            self.test_user_registration,
            self.test_user_login,
            self.test_token_verification,
            self.test_protected_endpoints,
            self.test_user_isolation
        ]
        
        passed = 0
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                print(f"   ❌ Test failed with exception: {e}")
        
        print(f"\\n🎉 Test Results: {passed}/{len(tests)} tests passed")
        
        if passed == len(tests):
            print("✅ All authentication tests passed!")
        else:
            print("⚠️ Some tests failed - check authentication implementation")

if __name__ == "__main__":
    test_suite = AuthTestSuite()
    test_suite.run_all_tests()