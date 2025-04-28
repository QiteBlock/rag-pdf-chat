from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
import logging
from pypdf import PdfReader
from openai import OpenAI
import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# OpenAI client setup
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    logger.error("OpenAI API key not found in environment variables")
    raise RuntimeError("OpenAI API key not configured")

client = OpenAI(api_key=openai_api_key)

# ChromaDB client setup with updated configuration
chroma_client = chromadb.PersistentClient(
    path=os.getenv("CHROMA_DB_PATH", "./chroma_db"),
    settings=Settings(
        anonymized_telemetry=False,
        allow_reset=True
    )
)

# Get or create collection
try:
    collection = chroma_client.get_collection("pdf_chunks")
except ValueError:
    collection = chroma_client.create_collection("pdf_chunks")

# Upload folder setup
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class QuestionRequest(BaseModel):
    user_question: str

class QuestionResponse(BaseModel):
    answer: str

@app.post("/upload_pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Create a safe filename
    safe_filename = "".join(c for c in file.filename if c.isalnum() or c in ('-', '_', '.')).rstrip()
    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)
    
    logger.info(f"Processing file: {safe_filename}")
    
    try:
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            content = await file.read()  # Read the file content
            buffer.write(content)  # Write it to disk
        
        logger.info(f"File saved successfully at: {file_path}")
        
        # Extract text from the saved PDF
        reader = PdfReader(file_path)
        extracted_text = ""
        for page_num, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text() or ""
                extracted_text += page_text
                logger.info(f"Processed page {page_num + 1}")
            except Exception as e:
                logger.error(f"Error processing page {page_num + 1}: {str(e)}")
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        logger.info("Text extraction completed")
        
        # Split the extracted text into chunks
        chunks = split_text(extracted_text)
        
        if not chunks:
            raise HTTPException(status_code=400, detail="Could not split text into chunks")
        
        logger.info(f"Created {len(chunks)} chunks")

        # Generate embeddings for the chunks
        embeddings = []
        for i, chunk in enumerate(chunks):
            try:
                embedding = get_embeddings(chunk)
                embeddings.append(embedding)
                logger.info(f"Generated embedding for chunk {i + 1}/{len(chunks)}")
            except Exception as e:
                logger.error(f"Error generating embedding for chunk {i + 1}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error generating embeddings: {str(e)}")

        # Store the embeddings and chunks in ChromaDB
        try:
            add_embeddings_to_chroma(chunks, embeddings)
            logger.info("Successfully stored embeddings in ChromaDB")
        except Exception as e:
            logger.error(f"Error storing embeddings: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error storing embeddings: {str(e)}")

        return {
            "message": f"Successfully processed {safe_filename}",
            "chunks_count": len(chunks)
        }
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Cleaned up file: {file_path}")
            except Exception as cleanup_error:
                logger.error(f"Error cleaning up file: {str(cleanup_error)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await file.close()  # Ensure the uploaded file is closed

@app.post("/ask_question/", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    try:
        # Generate embedding for the user's question
        query_embedding = get_embeddings(request.user_question)
        
        # Query ChromaDB for similar chunks
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=3
        )
        
        if not results['documents']:
            return QuestionResponse(answer="I don't have enough context to answer this question. Please upload a relevant PDF first.")
        
        # Combine relevant chunks into a single context
        context = "\n".join(results['documents'][0])
        
        # Send to OpenAI for answer generation
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that answers questions based on the provided context."},
                {"role": "user", "content": f"Context: {context}\n\nQuestion: {request.user_question}\n\nAnswer:"}
            ],
            max_tokens=500
        )
        
        return QuestionResponse(answer=response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Error processing question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def split_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

def get_embeddings(text: str) -> List[float]:
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=text
    )
    return response.data[0].embedding

def add_embeddings_to_chroma(chunks: List[str], embeddings: List[List[float]]) -> None:
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        collection.add(
            documents=[chunk],
            metadatas=[{"source": "pdf", "chunk_id": str(i)}],
            embeddings=[embedding],
            ids=[f"chunk_{i}"]
        )
