import json
from fastapi.testclient import TestClient
from app.main import app
from app.api.auth import OTP_STORE

client = TestClient(app)

def run_test():
    email = "admin@stocksense.com"
    print(f"--- Starting Password Reset Flow for {email} ---")
    
    # 1. Forgot Password
    res1 = client.post("/api/auth/forgot-password", json={"email": email})
    print("\n1. Forgot Password Response:")
    print(json.dumps(res1.json(), indent=2))
    
    # 2. Get the generated OTP from the store
    otp = OTP_STORE.get(email)
    print(f"\n[Mock Email Inbox] Received OTP: {otp}")
    
    # 3. Reset Password
    new_password = "new_secure_password"
    res2 = client.post("/api/auth/reset-password", json={
        "email": email,
        "otp": otp,
        "new_password": new_password
    })
    print("\n2. Reset Password Response:")
    print(json.dumps(res2.json(), indent=2))
    
    # 4. Login with New Password
    print("\n3. Attempting Login with New Password...")
    res3 = client.post("/api/auth/login", json={
        "email": email,
        "password": new_password
    })
    print("Login Response:")
    if res3.status_code == 200:
        data = res3.json()
        print(f"SUCCESS! Token received: {data['access_token'][:20]}...")
        print(f"Logged in as: {data['user']['full_name']}")
    else:
        print("FAILED to login:", res3.text)

if __name__ == "__main__":
    run_test()
