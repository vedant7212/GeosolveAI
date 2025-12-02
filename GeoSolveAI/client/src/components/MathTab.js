import React, { useState } from 'react';
import axios from 'axios';

function MathTab() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [plotExpr, setPlotExpr] = useState('sin(x)');
  const [plotFrom, setPlotFrom] = useState('0');
  const [plotTo, setPlotTo] = useState('360');
  const [plotResult, setPlotResult] = useState(null);
  const [difficulty, setDifficulty] = useState('Standard');
  const [geminiResult, setGeminiResult] = useState(null);
  const [mode, setMode] = useState('degrees');

  const handleSolve = async () => {
    if (!query.trim()) {
      alert('Please enter a math problem');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await axios.post('/api/solve', { query });
      setResult(response.data);
    } catch (error) {
      setResult({ error: error.response?.data?.error || 'An error occurred' });
    }
    setLoading(false);
  };

  const handlePlot = async () => {
    if (!plotExpr.trim()) {
      alert('Please enter an expression');
      return;
    }

    setLoading(true);
    setPlotResult(null);
    try {
      let fromVal = plotFrom.trim() === '' ? (mode === 'degrees' ? 0 : 0) : parseFloat(plotFrom);
      let toVal = plotTo.trim() === '' ? (mode === 'degrees' ? 360 : 2 * Math.PI) : parseFloat(plotTo);
      
      const response = await axios.post('/api/plot', {
        expr: plotExpr,
        from: fromVal,
        to: toVal,
        mode: mode
      });
      setPlotResult(response.data);
    } catch (error) {
      setPlotResult({ error: error.response?.data?.error || 'An error occurred' });
    }
    setLoading(false);
  };

  const handleGeminiExplain = async () => {
    if (!query.trim()) {
      alert('Please enter a math problem first');
      return;
    }

    setLoading(true);
    setGeminiResult(null);
    try {
      const response = await axios.post('/api/gemini', {
        prompt: query,
        difficulty: difficulty
      });
      setGeminiResult(response.data);
    } catch (error) {
      setGeminiResult({ error: error.response?.data?.error || 'An error occurred' });
    }
    setLoading(false);
  };

  return (
    <div className="math-tab">
      <h3>Math Problem Solver</h3>
      <p className="text-muted">Enter equations, integrals, derivatives, or expressions</p>

      <div className="mb-3">
        <label className="form-label">Examples:</label>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setQuery('solve 2*x^2 + 3*x - 5 = 0')}>
            Quadratic
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setQuery('integrate x^2 * sin(x)')}>
            Integration
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setQuery('differentiate tan(x)')}>
            Derivative
          </button>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Enter Math Problem:</label>
        <input
          type="text"
          className="form-control"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., solve 2*x + 3 = 0, integrate x^2, differentiate sin(x)"
          onKeyPress={(e) => e.key === 'Enter' && handleSolve()}
        />
      </div>

      <div className="difficulty-selector mb-3">
        <label className="form-label">Difficulty Level (for AI Tutor):</label>
        <div className="btn-group w-100" role="group">
          <button
            className={`btn ${difficulty === 'High School' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setDifficulty('High School')}
          >
            High School
          </button>
          <button
            className={`btn ${difficulty === 'Standard' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setDifficulty('Standard')}
          >
            Standard
          </button>
          <button
            className={`btn ${difficulty === 'College' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setDifficulty('College')}
          >
            College
          </button>
        </div>
      </div>

      <div className="mb-3 d-flex gap-2">
        <button className="btn btn-primary" onClick={handleSolve} disabled={loading}>
          {loading ? 'Solving...' : '🔍 Solve'}
        </button>
        <button className="btn btn-secondary" onClick={handleGeminiExplain} disabled={loading}>
          {loading ? 'Explaining...' : <><img src="/ai-tutor-icon.png" alt="AI" style={{height: '20px', marginRight: '8px'}} /> AI Explain</>}
        </button>
      </div>

      {result && (
        <div className="output-box">
          <h4>Solution:</h4>
          {result.error ? (
            <div className="error">❌ Error: {result.error}</div>
          ) : (
            <>
              <div className="success">✓ Type: {result.type}</div>
              <div className="success">✓ Result: {Array.isArray(result.solution) ? result.solution.join(', ') : result.solution}</div>
              {result.steps && result.steps.length > 0 && (
                <>
                  <h5 style={{color: '#4ec9b0', marginTop: '15px'}}>Steps:</h5>
                  {result.steps.map((step, idx) => (
                    <div key={idx} className="step">• {step}</div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {geminiResult && (
        <div className="output-box" style={{marginTop: '20px'}}>
          <h4>AI Tutor Explanation:</h4>
          {geminiResult.error ? (
            <div className="error">❌ Error: {geminiResult.error}</div>
          ) : (
            <div className="success" style={{whiteSpace: 'pre-wrap'}}>
              {geminiResult.explanation}
            </div>
          )}
        </div>
      )}

      <hr className="my-4" />

      <h3>Function Plotter</h3>
      <p className="text-muted">Visualize mathematical functions</p>

      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Expression:</label>
          <input
            type="text"
            className="form-control"
            value={plotExpr}
            onChange={(e) => setPlotExpr(e.target.value)}
            placeholder="e.g., sin(x), x^2, cos(x)*exp(-x)"
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Start {mode === 'degrees' ? 'Degrees' : 'Radians'}:</label>
          <input
            type="number"
            className="form-control"
            value={plotFrom}
            onChange={(e) => setPlotFrom(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">End {mode === 'degrees' ? 'Degrees' : 'Radians'}:</label>
          <input
            type="number"
            className="form-control"
            value={plotTo}
            onChange={(e) => setPlotTo(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-3 d-flex gap-2 align-items-center">
        <button className="btn btn-primary" onClick={handlePlot} disabled={loading}>
          {loading ? 'Plotting...' : '📊 Plot Graph'}
        </button>
        <button 
          className={`btn ${mode === 'degrees' ? 'btn-warning' : 'btn-outline-secondary'}`}
          onClick={() => setMode(mode === 'degrees' ? 'radians' : 'degrees')}
          title="Toggle between degrees and radians mode"
        >
          {mode === 'degrees' ? '📐 Degrees ✔' : '📐 Radians'}
        </button>
        <span className="badge bg-info">Mode: {mode === 'degrees' ? 'Degrees' : 'Radians'}</span>
      </div>

      {plotResult && (
        <>
          {plotResult.error ? (
            <div className="output-box">
              <div className="error">❌ {plotResult.error}</div>
            </div>
          ) : (
            <>
              {plotResult.single_value ? (
                <div className="output-box" style={{marginTop: '20px'}}>
                  <h4>Result:</h4>
                  <div className="success" style={{fontSize: '18px', fontWeight: 'bold'}}>
                    {plotResult.expression} = <span style={{color: '#1db5a6'}}>{parseFloat(plotResult.single_value).toFixed(6)}</span>
                  </div>
                </div>
              ) : null}
              <div className="image-result" style={{marginTop: '20px'}}>
                <img src={plotResult.image} alt="Plot" />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default MathTab;
