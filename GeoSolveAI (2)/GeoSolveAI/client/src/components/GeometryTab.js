import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/GeometryTab.css';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

function GeometryTab() {
  const device = useDeviceDetection();
  const mainCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const [command, setCommand] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scale, setScale] = useState(1);
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measureDistance, setMeasureDistance] = useState(null);
  const [drawMode, setDrawMode] = useState(false);
  const [rounderActive, setRounderActive] = useState(false);
  const [rounderStart, setRounderStart] = useState(null);
  const [rounderRotation, setRounderRotation] = useState(0);
  const [drawnCircles, setDrawnCircles] = useState([]);

  // Animate drawing
  const animateShapeDrawing = (imgSrc, callback) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      setIsDrawing(true);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create temporary canvas for drawing animation
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(img, 0, 0);

      const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      // Get pixel data
      let pixels = [];
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 128) {
          pixels.push(i / 4);
        }
      }

      // Shuffle pixels for drawing animation
      pixels.sort(() => Math.random() - 0.5);

      // Animate drawing
      let pixelIndex = 0;
      const drawNextPixel = () => {
        const batchSize = Math.max(1, Math.floor(pixels.length / 30));

        for (let i = 0; i < batchSize && pixelIndex < pixels.length; i++) {
          const idx = pixels[pixelIndex++];
          const pixelY = Math.floor(idx / img.width);
          const pixelX = idx % img.width;

          ctx.fillStyle = `rgb(${data[idx * 4]}, ${data[idx * 4 + 1]}, ${data[idx * 4 + 2]})`;
          ctx.fillRect(pixelX * scale, pixelY * scale, scale, scale);
        }

        if (pixelIndex < pixels.length) {
          requestAnimationFrame(drawNextPixel);
        } else {
          setIsDrawing(false);
          if (callback) callback();
        }
      };

      drawNextPixel();
    };

    img.src = imgSrc;
  };

  const handleDraw = async () => {
    if (!command.trim()) {
      alert('Please enter a geometry command');
      return;
    }

    setLoading(true);
    setResult(null);
    setMeasurePoints([]);
    setMeasureDistance(null);

    try {
      const response = await axios.post('/api/geometry', { command });
      setResult(response.data);

      if (response.data.image) {
        animateShapeDrawing(response.data.image, () => {
          drawMeasurementOverlay();
        });
      }
    } catch (error) {
      setResult({ error: error.response?.data?.error || 'An error occurred' });
    }
    setLoading(false);
  };

  const drawMeasurementOverlay = () => {
    const overlayCanvas = overlayCanvasRef.current;
    const mainCanvas = mainCanvasRef.current;
    if (!overlayCanvas || !mainCanvas) return;

    overlayCanvas.width = mainCanvas.width;
    overlayCanvas.height = mainCanvas.height;

    const ctx = overlayCanvas.getContext('2d');

    measurePoints.forEach((point, i) => {
      // Draw point
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#e67e22';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P${i + 1}`, point.x, point.y);
    });

    if (measurePoints.length === 2 && measureDistance !== null) {
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(measurePoints[0].x, measurePoints[0].y);
      ctx.lineTo(measurePoints[1].x, measurePoints[1].y);
      ctx.stroke();
      ctx.setLineDash([]);

      const midX = (measurePoints[0].x + measurePoints[1].x) / 2;
      const midY = (measurePoints[0].y + measurePoints[1].y) / 2;

      ctx.fillStyle = '#f39c12';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${measureDistance.toFixed(2)} units`, midX, midY - 20);
    }
  };

  const handleCanvasClick = (e) => {
    if (!measureMode || !mainCanvasRef.current) return;

    const rect = mainCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoints = [...measurePoints, { x, y }];
    setMeasurePoints(newPoints);

    if (newPoints.length === 2) {
      const distance =
        Math.sqrt(
          Math.pow(newPoints[1].x - newPoints[0].x, 2) +
            Math.pow(newPoints[1].y - newPoints[0].y, 2)
        ) /
        (40 * scale);
      setMeasureDistance(distance);
    } else if (newPoints.length > 2) {
      setMeasurePoints([{ x, y }]);
      setMeasureDistance(null);
    }
  };

  const handleRounderMouseDown = (e) => {
    if (!rounderActive || !drawingCanvasRef.current) return;
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRounderStart({ x, y });
  };

  const handleRounderMouseMove = (e) => {
    if (!rounderActive || !rounderStart || !drawingCanvasRef.current) return;
    
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = drawingCanvasRef.current.getContext('2d');
    
    // Clear and redraw canvas with all previous circles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    
    // Redraw all previously drawn circles
    drawnCircles.forEach(circle => {
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw center point
      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Calculate radius for current circle
    const radius = Math.sqrt(Math.pow(x - rounderStart.x, 2) + Math.pow(y - rounderStart.y, 2));
    
    // Draw center point for current circle
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(rounderStart.x, rounderStart.y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw circle being drawn
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(rounderStart.x, rounderStart.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw rounder needle/pencil
    ctx.save();
    ctx.translate(rounderStart.x, rounderStart.y);
    ctx.rotate((rounderRotation * Math.PI) / 180 + Math.atan2(y - rounderStart.y, x - rounderStart.x));
    
    // Draw rounder arm
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius, 0);
    ctx.stroke();
    
    // Draw pencil/needle at end
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(radius, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Show radius value
    ctx.fillStyle = '#667eea';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`R: ${(radius / 40).toFixed(2)} units`, 10, 20);
  };

  const handleRounderMouseUp = (e) => {
    if (!rounderStart || !drawingCanvasRef.current) return;
    
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate radius
    const radius = Math.sqrt(Math.pow(x - rounderStart.x, 2) + Math.pow(y - rounderStart.y, 2));
    
    // Save the drawn circle
    const newCircle = {
      x: rounderStart.x,
      y: rounderStart.y,
      r: radius
    };
    
    setDrawnCircles([...drawnCircles, newCircle]);
    
    // Circle is now drawn on the canvas - keep it visible and allow more circles
    setRounderStart(null);
  };

  // Initialize canvas with responsive sizing
  useEffect(() => {
    if (!mainCanvasRef.current || !drawingCanvasRef.current || !overlayCanvasRef.current) return;

    // Set responsive canvas sizes based on device
    let width = 800;
    let height = 500;

    if (device.isMobile) {
      width = Math.min(300, device.width - 40);
      height = 280;
    } else if (device.isTablet) {
      width = Math.min(600, device.width - 80);
      height = 350;
    }

    [mainCanvasRef, drawingCanvasRef, overlayCanvasRef].forEach(ref => {
      if (ref.current) {
        ref.current.width = width;
        ref.current.height = height;
        if (ref === mainCanvasRef) {
          const ctx = ref.current.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }
      }
    });
  }, [device.device, device.width, device.height]);

  useEffect(() => {
    drawMeasurementOverlay();
  }, [measurePoints, measureDistance]);

  useEffect(() => {
    if (result && result.image && mainCanvasRef.current) {
      animateShapeDrawing(result.image, () => {
        drawMeasurementOverlay();
      });
    }
  }, [scale]);

  const handlePreset = (cmd) => {
    setCommand(cmd);
  };

  const handleClear = () => {
    setCommand('');
    setResult(null);
    setMeasurePoints([]);
    setMeasureDistance(null);
    setDrawMode(false);
    setRounderActive(false);
    setRounderStart(null);
    setDrawnCircles([]);
    if (mainCanvasRef.current) {
      const canvas = mainCanvasRef.current;
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (overlayCanvasRef.current) {
      overlayCanvasRef.current.width = 800;
      overlayCanvasRef.current.height = 500;
    }
    if (drawingCanvasRef.current) {
      drawingCanvasRef.current.width = 800;
      drawingCanvasRef.current.height = 500;
      const ctx = drawingCanvasRef.current.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    }
  };

  return (
    <div className={`geometry-visualizer device-${device.device} ${device.isPortrait ? 'portrait' : 'landscape'}`}>
      <div className="geo-header">
        <h1>🎨 Geometry Visualizer</h1>
        <p>Draw shapes and compute their properties with realistic animations</p>
      </div>

      <div className="geo-container">
        {/* Left Sidebar */}
        <div className="geo-sidebar">
          <div className="geo-section">
            <h3>📋 Command</h3>
            <p className="section-desc">Draw shapes and compute their properties</p>

            <div className="examples-group">
              <label className="examples-label">Examples:</label>
              <div className="examples-buttons">
                <button
                  className="example-btn"
                  onClick={() => handlePreset('triangle 3 4 5')}
                >
                  Right Triangle
                </button>
                <button
                  className="example-btn"
                  onClick={() => handlePreset('triangle 5 5 5')}
                >
                  Equilateral Triangle
                </button>
                <button className="example-btn" onClick={() => handlePreset('circle 7')}>
                  Circle
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Enter Geometry Command:</label>
              <input
                type="text"
                className="command-input"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g., triangle 3 4 5, circle 7"
                onKeyPress={(e) => e.key === 'Enter' && handleDraw()}
              />
              <small className="input-help">
                Supported: <code>triangle [a] [b] [c]</code>, <code>circle [radius]</code>
              </small>
            </div>

            <button
              className="draw-button"
              onClick={handleDraw}
              disabled={loading || isDrawing}
            >
              {loading ? '⏳ Processing...' : isDrawing ? '✏️ Drawing...' : '✏️ Draw Shape'}
            </button>

            {result && (
              <div className="properties-box">
                {result.error ? (
                  <div className="error-message">❌ {result.error}</div>
                ) : (
                  <>
                    <h4>📊 Properties</h4>
                    <div className="properties-list">
                      <div className="prop-item">
                        <span className="prop-label">Shape:</span>
                        <span className="prop-value">{result.shape}</span>
                      </div>
                      {result.properties &&
                        Object.entries(result.properties).map(([key, value]) => (
                          <div key={key} className="prop-item">
                            <span className="prop-label">{key}:</span>
                            <span className="prop-value">
                              {Array.isArray(value) ? value.join(', ') : value}
                            </span>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <button className="clear-button" onClick={handleClear} disabled={loading}>
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="geo-canvas-area">
          <div className="canvas-toolbar">
            <div className="toolbar-group">
              <label className="toolbar-label">Scale:</label>
              <div className="scale-control">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="scale-slider"
                />
                <span className="scale-display">{(scale * 100).toFixed(0)}%</span>
              </div>
            </div>

            <button
              className={`measure-toggle ${measureMode ? 'active' : ''}`}
              onClick={() => {
                setMeasureMode(!measureMode);
                setDrawMode(false);
                setRounderActive(false);
                if (!measureMode) {
                  setMeasurePoints([]);
                  setMeasureDistance(null);
                }
              }}
            >
              📏 {measureMode ? 'Measuring' : 'Measure'}
            </button>

            <button
              className={`rounder-toggle ${rounderActive ? 'active' : ''}`}
              onClick={() => {
                setRounderActive(!rounderActive);
                setDrawMode(true);
                setMeasureMode(false);
                setMeasurePoints([]);
                setMeasureDistance(null);
                if (drawingCanvasRef.current) {
                  const ctx = drawingCanvasRef.current.getContext('2d');
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
                }
              }}
            >
              🔭 {rounderActive ? 'Drawing' : 'Rounder'}
            </button>
          </div>

          <div className="canvas-wrapper">
            {drawMode && rounderActive ? (
              <>
                <canvas
                  ref={drawingCanvasRef}
                  className="main-canvas"
                  width={800}
                  height={500}
                  onMouseDown={handleRounderMouseDown}
                  onMouseMove={handleRounderMouseMove}
                  onMouseUp={handleRounderMouseUp}
                  onMouseLeave={handleRounderMouseUp}
                  style={{ cursor: 'crosshair' }}
                />
                <div className="rounder-hint">
                  🔄 Rotate: <input
                    type="range"
                    min="0"
                    max="360"
                    value={rounderRotation}
                    onChange={(e) => setRounderRotation(parseInt(e.target.value))}
                    className="rotation-slider"
                  /> {rounderRotation}°
                </div>
              </>
            ) : (
              <>
                <canvas
                  ref={mainCanvasRef}
                  className="main-canvas"
                  width={800}
                  height={500}
                />
                <canvas
                  ref={overlayCanvasRef}
                  className="overlay-canvas"
                  onClick={handleCanvasClick}
                  style={{ cursor: measureMode ? 'crosshair' : 'default' }}
                />
              </>
            )}
          </div>

          {measureMode && (
            <div className="measure-guide">
              <p>👆 Click on canvas to measure distance between two points</p>
              {measurePoints.length > 0 && <p>Points selected: {measurePoints.length}/2</p>}
              {measureDistance !== null && (
                <p className="measure-result">
                  📐 Distance: <strong>{measureDistance.toFixed(2)} units</strong>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GeometryTab;
