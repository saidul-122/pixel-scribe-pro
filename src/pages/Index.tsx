import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brush, Eraser, Circle, Square, Undo2, Redo2, Save, Trash2, Palette, ChevronRight, ChevronLeft, Plus, Minus, X } from "lucide-react";

const Index = () => {
  // Landing page state
  const [showLanding, setShowLanding] = useState(true);
  
  // Canvas states
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"brush" | "eraser" | "circle" | "rectangle">("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [layers, setLayers] = useState<{id: number; name: string; visible: boolean; data?: ImageData}[]>([
    { id: 1, name: "Layer 1", visible: true }
  ]);
  const [activeLayer, setActiveLayer] = useState(1);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(true);
  const [showColorPanel, setShowColorPanel] = useState(true);
  const [startPos, setStartPos] = useState<{x: number; y: number} | null>(null);

  // References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Setup canvas on mount
  useEffect(() => {
    if (!canvasRef.current || showLanding) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.lineCap = 'round';
      context.lineJoin = 'round';
      
      // Set canvas size to match container
      const resizeCanvas = () => {
        if (canvasContainerRef.current) {
          const container = canvasContainerRef.current;
          canvas.width = container.clientWidth * 0.9; // Use 90% of container width
          canvas.height = container.clientHeight * 0.9; // Use 90% of container height
          
          // Save initial blank canvas state
          if (historyIndex === -1) {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            setHistory([imageData]);
            setHistoryIndex(0);
            
            // Update active layer with initial blank state
            setLayers(layers.map(layer => 
              layer.id === activeLayer ? { ...layer, data: imageData } : layer
            ));
          } else if (history.length > 0 && historyIndex >= 0) {
            // Restore previous state when resizing
            context.putImageData(history[historyIndex], 0, 0);
          }
        }
      };
      
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [showLanding, historyIndex, layers, activeLayer]);
  
  // Effect to update the canvas when active layer changes
  useEffect(() => {
    if (!canvasRef.current || showLanding) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (context && history.length > 0) {
      // Find the active layer
      const currentLayer = layers.find(layer => layer.id === activeLayer);
      
      // If there's saved data for this layer, render it
      if (currentLayer?.data) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.putImageData(currentLayer.data, 0, 0);
      } else if (historyIndex >= 0) {
        // Otherwise use latest history state
        context.putImageData(history[historyIndex], 0, 0);
      }
    }
  }, [activeLayer, showLanding]);
  
  // Save canvas state to history after action
  const saveToHistory = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Remove any future history if we're not at the end
      const newHistory = history.slice(0, historyIndex + 1);
      
      setHistory([...newHistory, imageData]);
      setHistoryIndex(historyIndex + 1);
      
      // Save the current state to the active layer
      setLayers(layers.map(layer => 
        layer.id === activeLayer ? { ...layer, data: imageData } : layer
      ));
    }
  };
  
  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const imageData = history[historyIndex - 1];
      
      if (canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          context.putImageData(imageData, 0, 0);
          
          // Update active layer data
          setLayers(layers.map(layer => 
            layer.id === activeLayer ? { ...layer, data: imageData } : layer
          ));
        }
      }
    }
  };
  
  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const imageData = history[historyIndex + 1];
      
      if (canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          context.putImageData(imageData, 0, 0);
          
          // Update active layer data
          setLayers(layers.map(layer => 
            layer.id === activeLayer ? { ...layer, data: imageData } : layer
          ));
        }
      }
    }
  };
  
  // Clear canvas function
  const clearCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
      }
    }
  };
  
  // Save drawing as image
  const saveAsImage = () => {
    if (canvasRef.current) {
      // Merge all visible layers before saving
      const canvas = canvasRef.current;
      
      // Create a temporary canvas to combine visible layers
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempContext = tempCanvas.getContext('2d');
      
      if (tempContext) {
        // Draw each visible layer onto the temp canvas
        layers.filter(layer => layer.visible && layer.data).forEach(layer => {
          if (layer.data) tempContext.putImageData(layer.data, 0, 0);
        });
        
        const link = document.createElement('a');
        link.download = 'pixel-art.png';
        link.href = tempCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };
  
  // Handle layer visibility
  const toggleLayerVisibility = (id: number) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ));
  };
  
  // Add new layer
  const addLayer = () => {
    const newId = layers.length > 0 ? Math.max(...layers.map(l => l.id)) + 1 : 1;
    
    // Create a blank layer
    let blankLayerData: ImageData | undefined = undefined;
    
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        // Save current canvas state
        const currentState = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Clear canvas to create blank layer
        context.clearRect(0, 0, canvas.width, canvas.height);
        blankLayerData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Restore previous state
        context.putImageData(currentState, 0, 0);
      }
    }
    
    setLayers([...layers, { id: newId, name: `Layer ${newId}`, visible: true, data: blankLayerData }]);
    setActiveLayer(newId);
  };
  
  // Delete layer
  const deleteLayer = (id: number) => {
    if (layers.length <= 1) return; // Don't allow deleting the last layer
    
    const newLayers = layers.filter(layer => layer.id !== id);
    setLayers(newLayers);
    
    // If active layer was deleted, set a new active layer
    if (activeLayer === id) {
      setActiveLayer(newLayers[0].id);
    }
  };
  
  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
      context.lineWidth = brushSize;
      
      let clientX: number;
      let clientY: number;
      
      if ('touches' in e) {
        const rect = canvas.getBoundingClientRect();
        clientX = e.touches[0].clientX - rect.left;
        clientY = e.touches[0].clientY - rect.top;
      } else {
        clientX = e.nativeEvent.offsetX;
        clientY = e.nativeEvent.offsetY;
      }
      
      if (tool === "brush" || tool === "eraser") {
        context.beginPath();
        context.moveTo(clientX, clientY);
      } else if (tool === "circle" || tool === "rectangle") {
        setStartPos({ x: clientX, y: clientY });
      }
    }
  };
  
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      let clientX: number;
      let clientY: number;
      
      if ('touches' in e) {
        e.preventDefault(); // Prevent scrolling on touch devices
        const rect = canvas.getBoundingClientRect();
        clientX = e.touches[0].clientX - rect.left;
        clientY = e.touches[0].clientY - rect.top;
      } else {
        clientX = e.nativeEvent.offsetX;
        clientY = e.nativeEvent.offsetY;
      }
      
      if (tool === "brush" || tool === "eraser") {
        context.lineTo(clientX, clientY);
        context.stroke();
      } else if (tool === "circle" && startPos) {
        // Preview circle
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempContext = tempCanvas.getContext('2d');
        
        if (tempContext) {
          // Restore previous state
          if (history[historyIndex]) {
            tempContext.putImageData(history[historyIndex], 0, 0);
          }
          
          // Draw new circle
          const radius = Math.sqrt(
            Math.pow(clientX - startPos.x, 2) + Math.pow(clientY - startPos.y, 2)
          );
          
          tempContext.beginPath();
          tempContext.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
          tempContext.strokeStyle = color;
          tempContext.lineWidth = brushSize;
          tempContext.stroke();
          
          // Draw to main canvas
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(tempCanvas, 0, 0);
        }
      } else if (tool === "rectangle" && startPos) {
        // Preview rectangle
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempContext = tempCanvas.getContext('2d');
        
        if (tempContext) {
          // Restore previous state
          if (history[historyIndex]) {
            tempContext.putImageData(history[historyIndex], 0, 0);
          }
          
          // Draw new rectangle
          const width = clientX - startPos.x;
          const height = clientY - startPos.y;
          
          tempContext.beginPath();
          tempContext.rect(startPos.x, startPos.y, width, height);
          tempContext.strokeStyle = color;
          tempContext.lineWidth = brushSize;
          tempContext.stroke();
          
          // Draw to main canvas
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(tempCanvas, 0, 0);
        }
      }
    }
  };
  
  const endDrawing = () => {
    if (!isDrawing) return;
    
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.closePath();
        setIsDrawing(false);
        setStartPos(null);
        saveToHistory();
      }
    }
  };
  
  if (showLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl w-full text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              PixelScribe Pro
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Create stunning digital art with our powerful yet intuitive drawing tool
          </p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-12 relative w-full max-w-3xl mx-auto h-64 md:h-96"
          >
            <img 
              src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=1200&h=600" 
              alt="Digital Art Example" 
              className="w-full h-full object-cover rounded-xl shadow-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60 rounded-xl"></div>
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <span className="bg-gray-900 bg-opacity-75 px-4 py-2 rounded-full text-sm">
                Unleash your creativity
              </span>
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800 bg-opacity-50 p-6 rounded-lg"
            >
              <div className="text-cyan-400 text-3xl mb-3">🎨</div>
              <h3 className="text-xl font-semibold mb-2">Versatile Tools</h3>
              <p className="text-gray-400">Choose from different brushes, shapes, and colors to create your masterpiece</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800 bg-opacity-50 p-6 rounded-lg"
            >
              <div className="text-purple-400 text-3xl mb-3">🖼️</div>
              <h3 className="text-xl font-semibold mb-2">Layer Support</h3>
              <p className="text-gray-400">Work with multiple layers to create complex and professional digital artwork</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-800 bg-opacity-50 p-6 rounded-lg"
            >
              <div className="text-pink-400 text-3xl mb-3">💾</div>
              <h3 className="text-xl font-semibold mb-2">Export Anytime</h3>
              <p className="text-gray-400">Save your creation as a PNG image with just a single click</p>
            </motion.div>
          </div>
          
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLanding(false)}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/20 hover:from-cyan-600 hover:to-purple-700 transition-all duration-300"
          >
            Start Drawing
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Header/Toolbar */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gray-800 px-4 py-3 flex items-center justify-between z-10 shadow-md"
      >
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            PixelScribe Pro
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`p-2 rounded-lg ${historyIndex <= 0 ? 'text-gray-600' : 'text-white hover:bg-gray-700'}`}
            title="Undo"
          >
            <Undo2 size={20} />
          </button>
          
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`p-2 rounded-lg ${historyIndex >= history.length - 1 ? 'text-gray-600' : 'text-white hover:bg-gray-700'}`}
            title="Redo"
          >
            <Redo2 size={20} />
          </button>
          
          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg text-white hover:bg-gray-700"
            title="Clear Canvas"
          >
            <Trash2 size={20} />
          </button>
          
          <button
            onClick={saveAsImage}
            className="ml-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-700 transition-colors"
            title="Save Image"
          >
            <div className="flex items-center">
              <Save size={18} className="mr-1" /> Save
            </div>
          </button>
        </div>
      </motion.div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Tools Panel */}
        <AnimatePresence>
          {showToolsPanel && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="w-16 bg-gray-800 flex flex-col items-center py-3 shadow-lg"
            >
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => setTool("brush")}
                  className={`p-2.5 rounded-lg ${tool === "brush" ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  title="Brush"
                >
                  <Brush size={20} />
                </button>
                
                <button
                  onClick={() => setTool("eraser")}
                  className={`p-2.5 rounded-lg ${tool === "eraser" ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  title="Eraser"
                >
                  <Eraser size={20} />
                </button>
                
                <button
                  onClick={() => setTool("circle")}
                  className={`p-2.5 rounded-lg ${tool === "circle" ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  title="Circle"
                >
                  <Circle size={20} />
                </button>
                
                <button
                  onClick={() => setTool("rectangle")}
                  className={`p-2.5 rounded-lg ${tool === "rectangle" ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  title="Rectangle"
                >
                  <Square size={20} />
                </button>
                
                <button
                  onClick={() => setShowColorPanel(!showColorPanel)}
                  className={`p-2.5 rounded-lg ${showColorPanel ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  title="Color Palette"
                >
                  <Palette size={20} />
                </button>
              </div>
              
              <div className="flex flex-col items-center mt-6 space-y-4">
                <div className="h-16 flex flex-col items-center justify-between">
                  <button
                    onClick={() => setBrushSize(prev => Math.min(prev + 2, 30))}
                    className="text-gray-300 hover:text-white p-1"
                    title="Increase Brush Size"
                  >
                    <Plus size={16} />
                  </button>
                  
                  <div className="text-xs text-gray-400">{brushSize}px</div>
                  
                  <button
                    onClick={() => setBrushSize(prev => Math.max(prev - 2, 1))}
                    className="text-gray-300 hover:text-white p-1"
                    title="Decrease Brush Size"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setShowToolsPanel(!showToolsPanel)}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-1 rounded-r-md z-10"
        >
          {showToolsPanel ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
        
        {/* Main Canvas */}
        <div className="flex-1 flex items-center justify-center bg-gray-900 relative" ref={canvasContainerRef}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
            className="bg-white shadow-2xl"
            style={{touchAction: 'none'}} // Prevents default touch actions like scrolling
          />
          
          {/* Color Panel */}
          <AnimatePresence>
            {showColorPanel && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg p-3 shadow-xl"
              >
                <div className="flex space-x-2 items-center">
                  <div className="flex space-x-2">
                    {["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"].map(colorValue => (
                      <button
                        key={colorValue}
                        onClick={() => setColor(colorValue)}
                        style={{ backgroundColor: colorValue }}
                        className={`w-8 h-8 rounded-full ${color === colorValue ? 'ring-2 ring-white' : ''}`}
                      />
                    ))}
                  </div>
                  
                  <div className="w-px h-8 bg-gray-700 mx-2"></div>
                  
                  <div className="flex items-center space-x-2">
                    <label htmlFor="custom-color" className="text-sm text-gray-300">Custom:</label>
                    <input
                      type="color"
                      id="custom-color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Right Layers Panel */}
        <AnimatePresence>
          {showLayersPanel && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="w-64 bg-gray-800 p-4 shadow-lg overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Layers</h2>
                <button
                  onClick={addLayer}
                  className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  title="Add Layer"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <div className="space-y-2">
                {layers.map((layer) => (
                  <div 
                    key={layer.id}
                    className={`p-2 rounded-lg flex items-center justify-between ${activeLayer === layer.id ? 'bg-gray-700' : 'hover:bg-gray-750'}`}
                    onClick={() => setActiveLayer(layer.id)}
                  >
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerVisibility(layer.id);
                        }}
                        className={`mr-2 w-4 h-4 rounded border ${layer.visible ? 'bg-cyan-500 border-cyan-600' : 'bg-transparent border-gray-500'}`}
                      />
                      <span className="text-sm text-gray-200">{layer.name}</span>
                    </div>
                    
                    {layers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLayer(layer.id);
                        }}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setShowLayersPanel(!showLayersPanel)}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-1 rounded-l-md z-10"
        >
          {showLayersPanel ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Index;
