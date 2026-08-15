import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Network, RefreshCw, Info } from 'lucide-react';
import { useStudent } from '../context/StudentContext';
import { getStudentGraph } from '../services/api';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

// ─── Custom Node Types ────────────────────────────────────────────────────────

const nodeStyles = {
  student:      { bg: 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: '#6366f1', label: '👤' },
  skill:        { bg: 'linear-gradient(135deg,#0f766e,#059669)', border: '#10b981', label: '⚡' },
  requiredSkill:{ bg: 'linear-gradient(135deg,#b45309,#d97706)', border: '#f59e0b', label: '🎯' },
  career:       { bg: 'linear-gradient(135deg,#7c3aed,#a21caf)', border: '#d946ef', label: '🏁' },
  job:          { bg: 'linear-gradient(135deg,#0369a1,#0284c7)', border: '#38bdf8', label: '💼' },
  company:      { bg: 'linear-gradient(135deg,#166534,#15803d)', border: '#4ade80', label: '🏢' },
  project:      { bg: 'linear-gradient(135deg,#9f1239,#be185d)', border: '#f43f5e', label: '📁' },
  technology:   { bg: 'linear-gradient(135deg,#374151,#4b5563)', border: '#9ca3af', label: '🔧' },
};

function CustomNode({ data }) {
  const style = nodeStyles[data.type] || nodeStyles.skill;
  return (
    <div
      style={{
        background: style.bg,
        border: `1.5px solid ${style.border}`,
        borderRadius: 12,
        padding: '8px 14px',
        minWidth: 100,
        maxWidth: 160,
        textAlign: 'center',
        boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${style.border}22`,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: style.border, border: 'none', width: 6, height: 6 }} />
      <div style={{ fontSize: 16, marginBottom: 2 }}>{style.label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.3, wordBreak: 'break-word' }}>
        {data.label}
      </div>
      {data.data?.proficiency && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
          {data.data.proficiency}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: style.border, border: 'none', width: 6, height: 6 }} />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

// ─── Layout helper — simple layered layout ────────────────────────────────────
function layoutNodes(rawNodes) {
  const typeOrder = ['student', 'skill', 'requiredSkill', 'career', 'project', 'job', 'company', 'technology'];
  const groups = {};
  rawNodes.forEach((n) => {
    const t = n.type || 'skill';
    if (!groups[t]) groups[t] = [];
    groups[t].push(n);
  });

  const positioned = [];
  let yOffset = 0;
  const VERT_GAP = 160;
  const HORIZ_GAP = 190;

  typeOrder.forEach((type) => {
    const group = groups[type] || [];
    group.forEach((node, i) => {
      const xOffset = (i - (group.length - 1) / 2) * HORIZ_GAP;
      positioned.push({
        id: node.id,
        type: 'custom',
        position: { x: 400 + xOffset, y: yOffset },
        data: { label: node.label, type: node.type, data: node.data },
      });
    });
    if (group.length > 0) yOffset += VERT_GAP;
  });

  return positioned;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function GraphPage() {
  const { currentStudent } = useStudent();
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const loadGraph = useCallback(async () => {
    if (!currentStudent) return;
    setLoading(true);
    setError(null);
    try {
      const { nodes, edges } = await getStudentGraph(currentStudent.id);

      const positionedNodes = layoutNodes(nodes);
      setRfNodes(positionedNodes);

      const rfEdges = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'smoothstep',
        animated: e.label?.includes('TARGETS') || e.label?.includes('HAS_SKILL'),
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        style: { stroke: '#4f46e5', strokeWidth: 1.5 },
        labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 500 },
        labelBgStyle: { fill: '#15152a', fillOpacity: 0.85 },
        labelBgPadding: [4, 6],
        labelBgBorderRadius: 4,
      }));
      setRfEdges(rfEdges);
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentStudent?.id]);

  useEffect(() => {
    if (currentStudent) loadGraph();
  }, [loadGraph]);

  const nodeLegend = Object.entries(nodeStyles).map(([type, style]) => ({
    type,
    label: type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1'),
    emoji: style.label,
    border: style.border,
  }));

  return (
    <div className="space-y-4 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white">Graph Explorer</h1>
          <p className="text-slate-400 text-sm mt-1">
            Interactive visualization of {currentStudent?.name || 'your'}'s career knowledge graph.
          </p>
        </div>
        <button className="btn-secondary text-sm" onClick={loadGraph} disabled={loading || !currentStudent}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 flex-shrink-0">
        {nodeLegend.map(({ type, label, emoji, border }) => (
          <div
            key={type}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-700/50 border border-surface-600 text-xs text-slate-300"
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: border, boxShadow: `0 0 4px ${border}` }} />
            {emoji} {label}
          </div>
        ))}
      </div>

      {/* Graph canvas */}
      <div className="flex-1 glass-card overflow-hidden rounded-2xl">
        {!currentStudent ? (
          <EmptyState title="No student selected" description="Select a student to visualize their graph." icon={Network} />
        ) : error ? (
          <ErrorState error={error} onRetry={loadGraph} />
        ) : loading && !loaded ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Building graph from CognoDB...</p>
            </div>
          </div>
        ) : rfNodes.length === 0 ? (
          <EmptyState
            title="No graph data"
            description="Add skills to generate a graph visualization."
            icon={Network}
          />
        ) : (
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            attributionPosition="bottom-right"
          >
            <Background color="#2e2e52" gap={20} size={1} />
            <Controls
              style={{
                background: '#15152a',
                border: '1px solid #312e81',
                borderRadius: 10,
              }}
            />
            <MiniMap
              nodeColor={(node) => nodeStyles[node.data?.type]?.border || '#6366f1'}
              maskColor="rgba(0,0,0,0.6)"
              style={{ borderRadius: 10 }}
            />
          </ReactFlow>
        )}
      </div>

      <div className="flex items-start gap-2 text-xs text-slate-500 flex-shrink-0">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <p>Nodes and edges are fetched live from CognoDB via parameterized Cypher. Pan to explore · scroll to zoom.</p>
      </div>
    </div>
  );
}
