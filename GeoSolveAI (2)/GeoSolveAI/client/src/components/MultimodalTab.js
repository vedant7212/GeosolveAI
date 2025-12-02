import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function MultimodalTab() {
  const [ocrResult, setOcrResult] = useState(null);
  const [pdfResult, setPdfResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleCanvasOCR = async () => {
    const canvas = canvasRef.current;
    
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('image', blob, 'sketch.png');

      setLoading(true);
      setOcrResult(null);
      try {
        const response = await axios.post('/api/ocr', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setOcrResult(response.data);
      } catch (error) {
        setOcrResult({ error: error.response?.data?.error || 'An error occurred' });
      }
      setLoading(false);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    setOcrResult(null);
    try {
      const response = await axios.post('/api/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setOcrResult(response.data);
    } catch (error) {
      setOcrResult({ error: error.response?.data?.error || 'An error occurred' });
    }
    setLoading(false);
  };

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setPdfResult(null);
    try {
      const response = await axios.post('/api/pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPdfResult(response.data);
    } catch (error) {
      setPdfResult({ error: error.response?.data?.error || 'An error occurred' });
    }
    setLoading(false);
  };

  return (
    <div className="multimodal-tab">
      <h3>Multimodal Input</h3>
      <p className="text-muted">Upload images, draw sketches, or extract from PDFs</p>

      <div className="row">
        <div className="col-md-6">
          <h5>Canvas Sketch</h5>
          <p className="text-muted">Draw your math problem below:</p>
          
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{border: '1px solid #ccc', borderRadius: '8px'}}
            />
          </div>

          <div className="d-flex gap-2 mt-2">
            <button className="btn btn-primary" onClick={handleCanvasOCR} disabled={loading}>
              {loading ? 'Processing...' : '🔍 Extract Text'}
            </button>
            <button className="btn btn-secondary" onClick={clearCanvas}>
              🗑️ Clear
            </button>
          </div>
        </div>

        <div className="col-md-6">
          <h5>Image Upload</h5>
          <p className="text-muted">Upload an image with math problems:</p>
          
          <input
            type="file"
            className="form-control mb-3"
            accept="image/*"
            onChange={handleImageUpload}
          />

          {imagePreview && (
            <div className="mb-3">
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{maxWidth: '100%', maxHeight: '200px', borderRadius: '8px'}}
              />
            </div>
          )}

          <hr className="my-4" />

          <h5>PDF Upload</h5>
          <p className="text-muted">Upload a PDF to extract text:</p>
          
          <input
            type="file"
            className="form-control"
            accept=".pdf"
            onChange={handlePDFUpload}
          />
        </div>
      </div>

      {ocrResult && (
        <div className="output-box mt-4">
          <h4>OCR Result:</h4>
          {ocrResult.error ? (
            <div className="error">❌ Error: {ocrResult.error}</div>
          ) : (
            <div className="success">
              <strong>Extracted Text:</strong>
              <pre style={{marginTop: '10px', color: '#d4d4d4'}}>{ocrResult.text}</pre>
            </div>
          )}
        </div>
      )}

      {pdfResult && (
        <div className="output-box mt-4">
          <h4>PDF Extraction Result:</h4>
          {pdfResult.error ? (
            <div className="error">❌ Error: {pdfResult.error}</div>
          ) : (
            <div className="success">
              <strong>Extracted Text:</strong>
              <pre style={{marginTop: '10px', color: '#d4d4d4', maxHeight: '300px', overflow: 'auto'}}>
                {pdfResult.text}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MultimodalTab;
