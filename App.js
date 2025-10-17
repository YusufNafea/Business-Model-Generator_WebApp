import React, { useState, useCallback } from "react";
import { Link, Users, CheckSquare, Gift, Heart, Layers, Truck, DollarSign, Tag, Plus, X, FileDown, Presentation } from "lucide-react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [bmc, setBmc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newItems, setNewItems] = useState({});

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload a .txt file first");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/generate_bmc", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      // Convert string responses to arrays of points
      const processedBmc = {};
      Object.keys(data.business_model_canvas).forEach(key => {
        const value = data.business_model_canvas[key];
        if (typeof value === 'string') {
          // Split by common delimiters and filter empty strings
          processedBmc[key] = value
            .split(/\n|•|-|,/)
            .map(item => item.trim())
            .filter(item => item && item !== '—');
          
          // If no points found, add placeholder
          if (processedBmc[key].length === 0) {
            processedBmc[key] = ['No data available'];
          }
        } else {
          processedBmc[key] = ['No data available'];
        }
      });
      
      setBmc(processedBmc);
    } catch (err) {
      console.error(err);
      alert("Error generating Business Model Canvas");
    } finally {
      setLoading(false);
    }
  };

  const addPoint = (section) => {
    const newPoint = newItems[section]?.trim();
    if (newPoint && bmc) {
      setBmc({
        ...bmc,
        [section]: [...bmc[section], newPoint]
      });
      setNewItems(prev => ({ ...prev, [section]: '' }));
    }
  };

  const removePoint = (section, index) => {
    if (bmc) {
      setBmc({
        ...bmc,
        [section]: bmc[section].filter((_, i) => i !== index)
      });
    }
  };

  const exportToPowerPoint = async () => {
    if (!bmc) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/export_ppt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bmc }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "business_model_canvas.pptx";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Error exporting to PowerPoint");
      }
    } catch (err) {
      console.error(err);
      alert("Error exporting to PowerPoint. Make sure the backend is running.");
    }
  };

  const handleInputChange = (section, value) => {
    setNewItems(prev => ({ ...prev, [section]: value }));
  };

  const BMCSection = React.memo(({ title, icon: Icon, section, data }) => {
    const inputValue = newItems[section] || '';
    
    return (
      <div className="bmc-box">
        <div className="box-header">
          <Icon className="icon" size={24} />
          <h3>{title}</h3>
        </div>
        <div className="box-content">
          <ul className="points-list">
            {data && data.map((point, idx) => (
              <li key={idx} className="point-item">
                <span className="point-text">{point}</span>
                <button
                  className="remove-btn"
                  onClick={() => removePoint(section, idx)}
                  title="Remove point"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="add-point-container">
          <input
            type="text"
            placeholder="Add new point..."
            value={inputValue}
            onChange={(e) => handleInputChange(section, e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPoint(section);
              }
            }}
            className="add-point-input"
          />
          <button
            className="add-point-btn"
            onClick={() => addPoint(section)}
            title="Add point"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    );
  });

  return (
    <div className="app">
      <h1 className="title">Business Model Canvas Generator</h1>

      <form onSubmit={handleSubmit} className="form-container">
        <input type="file" accept=".txt" onChange={handleFileChange} />
        <button type="submit" disabled={loading} className="generate-btn">
          {loading ? "Generating..." : "Generate Canvas"}
        </button>
      </form>

      {bmc && (
        <div className="canvas-wrapper">
          {/* Header with title and export buttons */}
          <div className="canvas-header">
            <h2 className="canvas-title">The Business Model Canvas</h2>
            <div className="export-buttons">
              <button onClick={exportToPowerPoint} className="export-btn ppt-btn">
                <Presentation size={18} />
                Export to PowerPoint
              </button>
            </div>
          </div>

          <div className="bmc-container">
            {/* TOP ROW */}
            <div className="bmc-row top-row">
              <BMCSection
                title="Key Partners"
                icon={Link}
                section="Key Partners"
                data={bmc["Key Partners"]}
              />

              <div className="bmc-column-group">
                <BMCSection
                  title="Key Activities"
                  icon={CheckSquare}
                  section="Key Activities"
                  data={bmc["Key Activities"]}
                />
                <BMCSection
                  title="Key Resources"
                  icon={Layers}
                  section="Key Resources"
                  data={bmc["Key Resources"]}
                />
              </div>

              <BMCSection
                title="Value Propositions"
                icon={Gift}
                section="Value Propositions"
                data={bmc["Value Propositions"]}
              />

              <div className="bmc-column-group">
                <BMCSection
                  title="Customer Relationships"
                  icon={Heart}
                  section="Customer Relationships"
                  data={bmc["Customer Relationships"]}
                />
                <BMCSection
                  title="Channels"
                  icon={Truck}
                  section="Channels"
                  data={bmc["Channels"]}
                />
              </div>

              <BMCSection
                title="Customer Segments"
                icon={Users}
                section="Customer Segments"
                data={bmc["Customer Segments"]}
              />
            </div>

            {/* BOTTOM ROW */}
            <div className="bmc-row bottom-row">
              <BMCSection
                title="Cost Structure"
                icon={Tag}
                section="Cost Structure"
                data={bmc["Cost Structure"]}
              />
              <BMCSection
                title="Revenue Streams"
                icon={DollarSign}
                section="Revenue Streams"
                data={bmc["Revenue Streams"]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;