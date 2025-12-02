import React, { useState } from 'react';
import '../styles/Seating.css';

function SeatingArrangement() {
  const [examName, setExamName] = useState('');
  const [rows, setRows] = useState(8);
  const [seatsPerRow, setSeatsPerRow] = useState(10);
  const [selectedSeats, setSelectedSeats] = useState(new Set());
  const [seatMap, setSeatMap] = useState(new Map());
  const [rollNumber, setRollNumber] = useState('');
  const [allocatedSeats, setAllocatedSeats] = useState([]);

  const generateSeats = () => {
    const newSeatMap = new Map();
    for (let r = 1; r <= rows; r++) {
      for (let s = 1; s <= seatsPerRow; s++) {
        const seatId = `${r}-${s}`;
        newSeatMap.set(seatId, false);
      }
    }
    setSeatMap(newSeatMap);
    setSelectedSeats(new Set());
    setAllocatedSeats([]);
  };

  const toggleSeat = (seatId) => {
    const newSelected = new Set(selectedSeats);
    if (newSelected.has(seatId)) {
      newSelected.delete(seatId);
    } else {
      newSelected.add(seatId);
    }
    setSelectedSeats(newSelected);
  };


  const clearAllocation = () => {
    setAllocatedSeats([]);
    setSelectedSeats(new Set());
    setSeatMap(new Map());
    setExamName('');
    setRollNumber('');
  };

  const downloadReport = () => {
    if (allocatedSeats.length === 0) {
      alert('No seats allocated yet');
      return;
    }

    let report = 'SEATING ARRANGEMENT REPORT\n';
    report += '=============================\n\n';
    allocatedSeats.forEach((allocation, idx) => {
      report += `${idx + 1}. ${allocation.name}\n`;
      report += `   Seats: ${allocation.seats.join(', ')}\n\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
    element.setAttribute('download', 'seating-arrangement.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (seatMap.size === 0) {
    return (
      <div className="seating-container">
        <div className="seating-setup">
          <h2>🎓 Exam Seating Arrangement</h2>
          <p>Configure exam hall seating for your examination</p>

          <div className="setup-form">
            <div className="form-group">
              <label>Number of Rows</label>
              <input
                type="number"
                min="1"
                max="50"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Seats per Row</label>
              <input
                type="number"
                min="1"
                max="50"
                value={seatsPerRow}
                onChange={(e) => setSeatsPerRow(parseInt(e.target.value))}
              />
            </div>

            <button className="btn-generate" onClick={generateSeats}>
              Generate Hall (Rows: {rows} × Seats: {seatsPerRow})
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getSeatColor = (seatId) => {
    for (let allocation of allocatedSeats) {
      if (allocation.seats.includes(seatId)) {
        return allocation.color;
      }
    }
    if (selectedSeats.has(seatId)) return '#ffd700';
    return '#e0e0e0';
  };

  return (
    <div className="seating-container">
      <div className="seating-header">
        <h2>🎓 Exam Seating Arrangement</h2>
        <div className="seating-legend">
          <div><span className="seat-legend available"></span> Available</div>
          <div><span className="seat-legend selected"></span> Selected</div>
          <div><span className="seat-legend allocated"></span> Allocated</div>
        </div>
      </div>

      <div className="seating-layout">
        <div className="seats-grid">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="seat-row">
              <span className="row-label">Row {r + 1}</span>
              {Array.from({ length: seatsPerRow }, (_, s) => {
                const seatId = `${r + 1}-${s + 1}`;
                const isAllocated = seatMap.get(seatId);
                return (
                  <button
                    key={seatId}
                    className={`seat ${isAllocated ? 'allocated' : ''} ${selectedSeats.has(seatId) ? 'selected' : ''}`}
                    style={{ backgroundColor: getSeatColor(seatId) }}
                    onClick={() => !isAllocated && toggleSeat(seatId)}
                    disabled={isAllocated}
                    title={seatId}
                  >
                    {s + 1}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="seating-control">
        <div className="allocation-form">
          <input
            type="text"
            placeholder="Enter exam name"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            className="name-input"
          />
          <input
            type="text"
            placeholder="Enter roll number"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            className="name-input"
          />
          <button className="btn-allocate" onClick={() => {
            if (!examName.trim()) {
              alert('Please enter exam name');
              return;
            }
            if (!rollNumber.trim()) {
              alert('Please enter roll number');
              return;
            }
            if (selectedSeats.size === 0) {
              alert('Please select at least one seat');
              return;
            }
            const newAllocated = [
              ...allocatedSeats,
              {
                name: `${examName} - Roll: ${rollNumber}`,
                seats: Array.from(selectedSeats).sort(),
                color: `hsl(${Math.random() * 360}, 70%, 60%)`
              }
            ];
            const newSeatMap = new Map(seatMap);
            selectedSeats.forEach(seatId => {
              newSeatMap.set(seatId, true);
            });
            setSeatMap(newSeatMap);
            setAllocatedSeats(newAllocated);
            setSelectedSeats(new Set());
            setExamName('');
            setRollNumber('');
          }}>
            Allocate {selectedSeats.size} Seat(s)
          </button>
        </div>

        <div className="allocation-list">
          <h3>Allocations ({allocatedSeats.length})</h3>
          {allocatedSeats.map((allocation, idx) => (
            <div key={idx} className="allocation-item" style={{ borderLeftColor: allocation.color }}>
              <strong>{idx + 1}. {allocation.name}</strong>
              <small>{allocation.seats.join(', ')}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="seating-actions">
        <button className="btn-download" onClick={downloadReport}>
          📥 Download Report
        </button>
        <button className="btn-reset" onClick={clearAllocation}>
          🔄 Clear All
        </button>
        <button className="btn-setup" onClick={() => setSeatMap(new Map())}>
          ⚙️ Change Setup
        </button>
      </div>
    </div>
  );
}

export default SeatingArrangement;
