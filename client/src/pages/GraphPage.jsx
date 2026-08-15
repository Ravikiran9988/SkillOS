import React, { useEffect, useState, useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAuth } from '../context/AuthContext';
import { getStudentGraph, getCareers, getJobs } from '../services/api';
import ErrorState from '../components/ErrorState';
import { PageSkeleton } from '../components/LoadingSkeleton';
import { Network, Info, Sparkles, Filter, RefreshCw, Compass } from 'lucide-react';

const nodeColors = {
  Person: { bg: '#4f46e5', border: '#818cf8', text: '#ffffff', label: 'You (Student)' },
  Skill: { bg: '#0891b2', border: '#22d3ee', text: '#ffffff', label: 'Skill' },
  CareerRole: { bg: '#d97706', border: '#fcd34d', text: '#ffffff', label: 'Target Career' },
  Job: { bg: '#059669', border: '#34d399', text: '#ffffff', label: 'Job Opening' },
  Project: { bg: '#7c3aed', border: '#a78bfa', text: '#ffffff', label: 'Project' },
  Company: { bg: '#dc2626', border: '#f87171', text: '#ffffff', label: 'Company' },
};

export default function GraphPage() {
  const { user } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const loadGraph = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    setSelectedNode(null);

    getStudentGraph(user.id)
      .then((data) => {
        const rawNodes = data.nodes || [];
        const rawEdges = data.links || [];

        // Position nodes radially / hierarchically centered on student
        const flowNodes = rawNodes.map((n, index) => {
          const cfg = nodeColors[n.label] || { bg: '#475569', border: '#94a3b8', text: '#fff' };
          const isCenter = n.label === 'Person';

          const angle = (index / Math.max(1, rawNodes.length - 1)) * 2 * Math.PI;
          const radius = isCenter ? 0 : n.label === 'Skill' ? 220 : n.label === 'CareerRole' ? 380 : 480;

          return {
            id: n.id,
            data: { label: n.name || n.id, raw: n },
            position: {
              x: 500 + (isCenter ? 0 : Math.cos(angle) * radius),
              y: 350 + (isCenter ? 0 : Math.sin(angle) * radius),
            },
            style: {
              background: cfg.bg,
              color: cfg.text,
              border: `2px solid ${cfg.border}`,
              borderRadius: isCenter ? '24px' : '14px',
              padding: isCenter ? '14px 22px' : '8px 14px',
              fontSize: isCenter ? '13px' : '11px',
              fontWeight: isCenter ? '800' : '600',
              boxShadow: isCenter
                ? '0 0 30px rgba(99, 102, 241, 0.4)'
                : '0 4px 15px rgba(0, 0, 0, 0.3)',
              cursor: 'pointer',
            },
          };
        });

        const flowEdges = rawEdges.map((e, idx) => ({
          id: `e-${idx}`,
          source: e.source,
          target: e.target,
          label: e.type || '',
          labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 600 },
          labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
          labelBgPadding: [4, 2],
          style: { stroke: '#475569', strokeWidth: 1.5 },
          animated: e.type === 'TARGETS' || e.type === 'REQUIRES',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node.data.raw);
  }, []);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={loadGraph} />;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Network className="w-7 h-7 text-indigo-400" /> My Career Graph
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Visualizing your personal graph ecosystem: verified skills, projects, goal alignment, and job routes.
          </p>
        </div>

        <button
          onClick={loadGraph}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-center Graph
        </button>
      </div>

      {/* ─── Graph Canvas & Legend ───────────────────────────────────────── */}
      <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden h-[620px]">
        {/* Top Legend Bar */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 flex-wrap p-2 rounded-2xl bg-slate-950/90 border border-slate-800/80 backdrop-blur-md">
          {Object.entries(nodeColors).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 px-2 py-0.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.bg }} />
              {cfg.label}
            </span>
          ))}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300" />
          <MiniMap
            nodeColor={(n) => {
              const raw = n.data?.raw;
              return nodeColors[raw?.label]?.bg || '#64748b';
            }}
            className="!bg-slate-950 !border-slate-800"
          />
        </ReactFlow>

        {/* Selected Node Sidebar Overlay */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-10 w-72 p-5 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                {selectedNode.label} Entity
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <h4 className="text-base font-bold text-white">{selectedNode.name || selectedNode.title || selectedNode.id}</h4>

            {selectedNode.proficiency && (
              <div className="text-xs text-slate-300">
                Proficiency: <span className="font-bold text-emerald-400">{selectedNode.proficiency}</span>
              </div>
            )}
            {selectedNode.category && (
              <div className="text-xs text-slate-400">Category: {selectedNode.category}</div>
            )}
            {selectedNode.description && (
              <div className="text-xs text-slate-400 line-clamp-3">{selectedNode.description}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
