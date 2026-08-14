import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        # 1. Login
        resp = await client.post("https://shikshamitr.onrender.com/api/auth/login", data={
            "username": "rushalbangar19@gmail.com",
            "password": "Morya@123"
        })
        print("Login:", resp.status_code, resp.text)
        token = resp.json()["access_token"]
        
        # 2. Upload file
        headers = {"Authorization": f"Bearer {token}"}
        files = {"file": ("test.pdf", b"dummy pdf content", "application/pdf")}
        
        resp2 = await client.post("https://shikshamitr.onrender.com/api/files/upload", headers=headers, files=files)
        print("Upload:", resp2.status_code, resp2.text)

if __name__ == "__main__":
    asyncio.run(main())
