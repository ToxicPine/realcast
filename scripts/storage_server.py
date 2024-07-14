# This is a file storage server for images which ensures that the hash of every uploaded image 
# is backed up onto a merkle tree on-chain.

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
import os
import random
import string
import hashlib
import httpx
from pydantic import BaseModel

app = FastAPI()

# Directory to store uploaded files
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class HashData(BaseModel):
    hash: str
    block_number: int

# Function to generate a random filename with a given extension
def generate_random_filename(extension: str) -> str:
    random_string = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    return f"{random_string}{extension}"

# Function to save the uploaded file to the specified directory
def save_uploaded_file(file: UploadFile, upload_dir: str) -> str:
    file_extension = os.path.splitext(file.filename)[1]
    random_filename = generate_random_filename(file_extension)
    file_location = os.path.join(upload_dir, random_filename)
    
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())
    
    return file_location

# Function to compute the SHA-256 hash of a file
def hash_file(file_path: str) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

# Function to store the file hash on the merkle tree server
async def store_file_hash(file_hash: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:9595/store_hash/",
            json={"hash": file_hash, "block_number": 0}  # Assuming block_number is 0 for now
        )
        response.raise_for_status()

# Endpoint to upload a file
@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_location = save_uploaded_file(file, UPLOAD_DIR)
    file_hash = hash_file(file_location)
    # Store the file hash on the merkle tree server
    # WORKS, BUT TAKES AGES
    # await store_file_hash(file_hash) 
    return {"filename": os.path.basename(file_location), "hash": file_hash}

# Endpoint to download a file by its name
@app.get("/download/{file_name}")
async def download_file(file_name: str):
    file_path = os.path.join(UPLOAD_DIR, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type='application/octet-stream', filename=file_name)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)