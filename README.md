# PDF Chat Application

A full-stack application that allows users to upload PDF documents and interact with them through a chat interface. The application uses OpenAI's GPT model for answering questions and ChromaDB for vector storage and retrieval.

## Features

- PDF document upload and processing
- Text extraction and chunking
- Vector embeddings generation
- Semantic search capabilities
- Interactive chat interface
- Real-time question answering

## Tech Stack

### Backend

- FastAPI (Python web framework)
- OpenAI API (for embeddings and chat)
- ChromaDB (vector database)
- PyPDF (PDF processing)

### Frontend

- React.js
- Modern UI components
- Responsive design

## Prerequisites

- Python 3.8+
- Node.js 14+
- OpenAI API key
- npm or yarn

## Environment Setup

### Backend

Create a `.env` file in the backend directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key_here
CHROMA_DB_PATH=./chroma_db
UPLOAD_FOLDER=uploads
```

### Frontend

Create a `.env` file in the frontend directory with the following variables:

```
REACT_APP_API_URL=http://localhost:8000
```

## Installation

### Backend

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Upload a PDF document through the interface
3. Once the document is processed, you can start asking questions about its content
4. The system will provide relevant answers based on the document's content

## API Endpoints

### Backend

- `POST /upload_pdf/`: Upload a PDF file
- `POST /ask_question/`: Ask questions about the uploaded PDF

## Project Structure

```
.
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── .gitignore
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── .env
│   └── .gitignore
└── README.md
```

## Security Considerations

- Never commit your `.env` files
- Keep your OpenAI API key secure
- Use environment variables for sensitive information
- Implement proper error handling

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
