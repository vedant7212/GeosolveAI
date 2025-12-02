# GeoSolve - AI-Powered Math & Geometry Web Application

## Overview
GeoSolve is an advanced, AI-powered web application developed by CALCORE for solving math problems, visualizing geometry, performing OCR on images/PDFs, and providing AI-powered tutoring.

## Project Structure
```
├── app.py                  # Flask backend with all API endpoints
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/               # React components
│   │   ├── components/    # Tab components (Math, Geometry, Multimodal)
│   │   ├── App.js         # Main React app
│   │   ├── App.css        # Styling
│   │   └── index.js       # Entry point
│   ├── build/             # Production build (served by Flask)
│   └── package.json       # Frontend dependencies
├── uploads/               # Temporary file storage
└── .gitignore            # Git ignore rules
```

## Tech Stack

### Backend (Python/Flask)
- **Flask**: REST API server
- **SymPy**: Symbolic mathematics (solving, integration, differentiation)
- **matplotlib**: Graph plotting and geometry visualization
- **NumPy**: Numerical computations
- **pytesseract**: OCR for text extraction from images
- **pdfplumber**: PDF text extraction
- **Pillow**: Image processing
- **Flask-CORS**: Cross-origin resource sharing
- **Google Gemini AI**: AI tutoring and explanations (requires GEMINI_API_KEY)

### Frontend (React)
- **React 18**: Modern UI library
- **Bootstrap 5**: UI components and styling
- **Axios**: HTTP client for API requests
- **Canvas API**: Drawing interface for handwritten input

## Features

### 1. Math Problem Solver (/api/solve)
- Solves equations: `solve 2*x^2 + 3*x - 5 = 0`
- Integration: `integrate x^2 * sin(x)`
- Differentiation: `differentiate tan(x)`
- Expression simplification
- Step-by-step explanations

### 2. Function Plotter (/api/plot)
- Plots mathematical functions
- Customizable range (from/to)
- Returns base64-encoded PNG images

### 3. Geometry Visualizer (/api/geometry)
- Draw triangles: `triangle 3 4 5`
- Draw circles: `circle 7`
- Computes area, perimeter, angles
- Visual representation with matplotlib

### 4. Image OCR (/api/ocr)
- Extracts text from uploaded images
- Uses pytesseract with tesseract system binary
- Supports printed and handwritten math problems

### 5. Canvas Sketch Input
- Draw math problems on canvas
- Convert sketch to text via OCR
- Interactive drawing interface

### 6. PDF Text Extraction (/api/pdf)
- Upload PDFs with math problems
- Extract all text content
- Process with pdfplumber

### 7. AI Tutoring (/api/gemini)
- Powered by Google Gemini AI
- Step-by-step explanations
- Alternative solving methods
- Difficulty levels: High School, Standard, College
- Practice problem generation

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/solve` | POST | Solve math problems |
| `/api/plot` | POST | Plot mathematical functions |
| `/api/geometry` | POST | Draw and analyze shapes |
| `/api/ocr` | POST | Extract text from images |
| `/api/pdf` | POST | Extract text from PDFs |
| `/api/gemini` | POST | Get AI-powered explanations |

## Setup Instructions

### Prerequisites
- Python 3.11
- Node.js 20
- Tesseract OCR system dependency

### Installation
1. Python dependencies are managed via `uv` (automatically installed)
2. Frontend dependencies: `cd client && npm install`
3. Build frontend: `cd client && npm run build`

### Environment Variables
- `GEMINI_API_KEY`: Required for AI tutoring features (add in Replit Secrets)
- `SESSION_SECRET`: Flask session secret (already configured)

### Running the Application
The workflow "GeoSolve Server" runs:
```bash
python app.py
```
- Flask serves the built React app from `client/build/`
- Runs on port 5000
- Access at: https://<repl-name>.<username>.repl.co

## Development Notes

### Recent Changes (November 21, 2025)
- ✅ Created Flask backend with all 6 API endpoints
- ✅ Implemented SymPy-based math solver with step-by-step explanations
- ✅ Added matplotlib-based geometry visualizer (triangles, circles)
- ✅ Implemented function plotter with customizable ranges
- ✅ Added OCR support using pytesseract
- ✅ Implemented PDF text extraction with pdfplumber
- ✅ Integrated Google Gemini AI for tutoring
- ✅ Created React frontend with tabbed interface (Math | Geometry | Multimodal)
- ✅ Added canvas sketch input for handwritten equations
- ✅ Implemented image and PDF upload functionality
- ✅ Configured production build and Flask workflow on port 5000
- ✅ Added Bootstrap styling with gradient background
- ✅ Created comprehensive .gitignore for Python and Node.js

### Architecture Decisions
1. **Monolithic Structure**: Flask serves both API and static React build
2. **Base64 Images**: Matplotlib plots returned as base64 PNG for easy display
3. **OCR Fallback**: pytesseract used (EasyOCR unavailable on Linux in Replit)
4. **Production Build**: React app pre-built and served by Flask for simplicity
5. **Port 5000**: Required for Replit webview exposure

### Known Limitations
- OCR uses pytesseract only (EasyOCR has dependency conflicts on Linux/Replit)
- Development server warning (OK for demo, use Gunicorn for production deployment)
- OCR accuracy depends on image quality, handwriting clarity, and text contrast
- Tesseract system binary required (already installed in this environment)

## Future Enhancements
1. Add equation history and saved solutions dashboard
2. Implement interactive geometry editor with drag-and-drop
3. Create practice quiz generator with automatic grading
4. Add LaTeX rendering for mathematical notation
5. Implement PWA support for offline access
6. Add more geometry shapes (rectangles, polygons, etc.)
7. Improve OCR with better preprocessing
8. Add user authentication and solution history

## Deployment
- Flask serves static files from `client/build/`
- All API routes prefixed with `/api/`
- Frontend routes handled by React Router (if added)
- Ready for deployment on Replit or any Python hosting platform

## Troubleshooting
- **GEMINI_API_KEY error**: Add your Google AI API key in Replit Secrets
- **OCR not working**: Ensure tesseract system package is installed
- **Build errors**: Clear `client/node_modules/` and rebuild
- **Port issues**: Ensure Flask runs on port 5000 for Replit webview

## Credits
Developed by CALCORE | Powered by SymPy, Flask, React & Google Gemini AI
