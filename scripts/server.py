from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
import os
import random
import string

app = FastAPI()

# Directory to store uploaded files
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def generate_random_filename(extension: str) -> str:
    random_string = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    return f"{random_string}{extension}"

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_extension = os.path.splitext(file.filename)[1]
    random_filename = generate_random_filename(file_extension)
    file_location = os.path.join(UPLOAD_DIR, random_filename)
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())
    return {"filename": random_filename}

@app.get("/download/{file_name}")
async def download_file(file_name: str):
    file_path = os.path.join(UPLOAD_DIR, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type='application/octet-stream', filename=file_name)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)