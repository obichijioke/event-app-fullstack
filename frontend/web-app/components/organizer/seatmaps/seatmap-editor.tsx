'use client';

import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Circle } from 'react-konva';
import type Konva from 'konva';
import {
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Move,
  Square,
  Circle as CircleIcon,
  Trash2,
  Grid3x3,
} from 'lucide-react';

export interface SeatData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'standard' | 'vip' | 'accessible';
  section?: string;
  row?: string;
  number?: string;
}

export interface SeatmapSpec {
  version: string;
  canvasWidth: number;
  canvasHeight: number;
  seats: SeatData[];
}

interface SeatmapEditorProps {
  initialSpec?: SeatmapSpec;
  onSave: (spec: SeatmapSpec) => void;
  onCancel: () => void;
}

const DEFAULT_SPEC: SeatmapSpec = {
  version: '1.0',
  canvasWidth: 1000,
  canvasHeight: 800,
  seats: [],
};

export function SeatmapEditor({ initialSpec, onSave, onCancel }: SeatmapEditorProps) {
  const [spec, setSpec] = useState<SeatmapSpec>(initialSpec || DEFAULT_SPEC);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'rect' | 'circle'>('select');
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<SeatmapSpec[]>([spec]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);

  const selectedSeat = spec.seats.find((s) => s.id === selectedSeatId);

  const addToHistory = (newSpec: SeatmapSpec) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSpec);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSpec(newSpec);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSpec(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSpec(history[historyIndex + 1]);
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.5));
  };

  const handleStageClick = (e: any) => {
    // Clicked on empty area
    if (e.target === e.target.getStage()) {
      setSelectedSeatId(null);
      return;
    }

    // Clicked on a seat
    const seatId = e.target.attrs.seatId;
    if (seatId) {
      setSelectedSeatId(seatId);
    }
  };

  const handleSeatDragEnd = (e: any, seatId: string) => {
    const newSeats = spec.seats.map((seat) =>
      seat.id === seatId
        ? { ...seat, x: e.target.x(), y: e.target.y() }
        : seat
    );
    addToHistory({ ...spec, seats: newSeats });
  };

  const handleAddSeat = () => {
    const newSeat: SeatData = {
      id: `seat-${Date.now()}`,
      x: 100,
      y: 100,
      width: tool === 'circle' ? 40 : 40,
      height: tool === 'circle' ? 40 : 40,
      type: 'standard',
      section: '',
      row: '',
      number: '',
    };
    addToHistory({ ...spec, seats: [...spec.seats, newSeat] });
    setSelectedSeatId(newSeat.id);
    setTool('select');
  };

  const handleDeleteSeat = () => {
    if (!selectedSeatId) return;
    const newSeats = spec.seats.filter((s) => s.id !== selectedSeatId);
    addToHistory({ ...spec, seats: newSeats });
    setSelectedSeatId(null);
  };

  const handleUpdateSeat = (updates: Partial<SeatData>) => {
    if (!selectedSeatId) return;
    const newSeats = spec.seats.map((seat) =>
      seat.id === selectedSeatId ? { ...seat, ...updates } : seat
    );
    addToHistory({ ...spec, seats: newSeats });
  };

  const getSeatColor = (type: SeatData['type']) => {
    switch (type) {
      case 'vip':
        return '#f59e0b'; // amber
      case 'accessible':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
      {/* Toolbar */}
      <div className="w-16 bg-card rounded-lg shadow-card border border-border p-2 flex flex-col gap-2">
        <button
          onClick={() => setTool('select')}
          className={`p-3 rounded-md transition ${
            tool === 'select'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-secondary'
          }`}
          title="Select (V)"
        >
          <Move className="w-5 h-5" />
        </button>
        <button
          onClick={() => setTool('rect')}
          className={`p-3 rounded-md transition ${
            tool === 'rect'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-secondary'
          }`}
          title="Rectangle Seat (R)"
        >
          <Square className="w-5 h-5" />
        </button>
        <button
          onClick={() => setTool('circle')}
          className={`p-3 rounded-md transition ${
            tool === 'circle'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-secondary'
          }`}
          title="Circle Seat (C)"
        >
          <CircleIcon className="w-5 h-5" />
        </button>
        <div className="h-px bg-border my-2" />
        <button
          onClick={handleUndo}
          disabled={historyIndex === 0}
          className="p-3 rounded-md hover:bg-secondary transition disabled:opacity-50"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-5 h-5" />
        </button>
        <button
          onClick={handleRedo}
          disabled={historyIndex === history.length - 1}
          className="p-3 rounded-md hover:bg-secondary transition disabled:opacity-50"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-5 h-5" />
        </button>
        <div className="h-px bg-border my-2" />
        <button
          onClick={handleZoomIn}
          className="p-3 rounded-md hover:bg-secondary transition"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-3 rounded-md hover:bg-secondary transition"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-card rounded-lg shadow-card border border-border overflow-hidden flex flex-col">
        {/* Canvas Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleAddSeat}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm"
            >
              <Square className="w-4 h-4" />
              Add Seat
            </button>
            <div className="text-sm text-muted-foreground">
              {spec.seats.length} seat{spec.seats.length !== 1 ? 's' : ''} | Zoom: {Math.round(zoom * 100)}%
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-border rounded-md hover:bg-secondary transition text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(spec)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm"
            >
              <Save className="w-4 h-4" />
              Save Seatmap
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-secondary/20 p-8">
          <div className="bg-white rounded-lg shadow-lg inline-block">
            <Stage
              ref={stageRef}
              width={spec.canvasWidth * zoom}
              height={spec.canvasHeight * zoom}
              scaleX={zoom}
              scaleY={zoom}
              onClick={handleStageClick}
            >
              <Layer>
                {/* Grid */}
                {Array.from({ length: Math.ceil(spec.canvasWidth / 50) }).map((_, i) => (
                  <Rect
                    key={`grid-v-${i}`}
                    x={i * 50}
                    y={0}
                    width={1}
                    height={spec.canvasHeight}
                    fill="#e5e7eb"
                  />
                ))}
                {Array.from({ length: Math.ceil(spec.canvasHeight / 50) }).map((_, i) => (
                  <Rect
                    key={`grid-h-${i}`}
                    x={0}
                    y={i * 50}
                    width={spec.canvasWidth}
                    height={1}
                    fill="#e5e7eb"
                  />
                ))}

                {/* Seats */}
                {spec.seats.map((seat) => (
                  <Rect
                    key={seat.id}
                    seatId={seat.id}
                    x={seat.x}
                    y={seat.y}
                    width={seat.width}
                    height={seat.height}
                    fill={getSeatColor(seat.type)}
                    stroke={selectedSeatId === seat.id ? '#1e40af' : '#000'}
                    strokeWidth={selectedSeatId === seat.id ? 3 : 1}
                    draggable={tool === 'select'}
                    onDragEnd={(e) => handleSeatDragEnd(e, seat.id)}
                    cornerRadius={4}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-card rounded-lg shadow-card border border-border p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Properties</h3>

        {!selectedSeat && (
          <div className="text-sm text-muted-foreground">
            Select a seat to edit its properties
          </div>
        )}

        {selectedSeat && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <input
                type="text"
                value={selectedSeat.section || ''}
                onChange={(e) => handleUpdateSeat({ section: e.target.value })}
                placeholder="e.g., A, B, VIP"
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Row</label>
              <input
                type="text"
                value={selectedSeat.row || ''}
                onChange={(e) => handleUpdateSeat({ row: e.target.value })}
                placeholder="e.g., 1, 2, 3"
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Number</label>
              <input
                type="text"
                value={selectedSeat.number || ''}
                onChange={(e) => handleUpdateSeat({ number: e.target.value })}
                placeholder="e.g., 1, 2, 3"
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Seat Type</label>
              <select
                value={selectedSeat.type}
                onChange={(e) =>
                  handleUpdateSeat({ type: e.target.value as SeatData['type'] })
                }
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              >
                <option value="standard">Standard</option>
                <option value="vip">VIP</option>
                <option value="accessible">Accessible</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Width</label>
                <input
                  type="number"
                  value={selectedSeat.width}
                  onChange={(e) =>
                    handleUpdateSeat({ width: parseInt(e.target.value) || 40 })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height</label>
                <input
                  type="number"
                  value={selectedSeat.height}
                  onChange={(e) =>
                    handleUpdateSeat({ height: parseInt(e.target.value) || 40 })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={handleDeleteSeat}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Seat
              </button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 pt-4 border-t border-border">
          <h4 className="font-medium text-sm mb-3">Seat Types</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#6b7280]" />
              <span>Standard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#f59e0b]" />
              <span>VIP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#3b82f6]" />
              <span>Accessible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
