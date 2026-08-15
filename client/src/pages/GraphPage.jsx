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
import { getStudentGraph } from '../services/api';
import ErrorState from '../components/ErrorState';
import { PageSkeleton } from '../components/LoadingSkeleton';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Network, Info, Sparkles, RefreshCw, X } from 'lucide-react';

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

        // Position nodes radially centered on student
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
              borderRadius: isCenter ? '24px' : '16px',
              padding: isCenter ? '14px 20px' : '10px 16px',
              fontWeight: isCenter ? '800' : '600',
              fontSize: isCenter ? '14px' : '12px',
              boxShadow: isCenter ? '0 0 30px rgba(79, 70, 229, 0.4)' : '0 4px 12px rgba(0,0,0,0.3)',
              cursor: 'pointer',
            },
          };
        });

        const flowEdges = rawEdges.map((e, idx) => ({
          id: `e-${idx}-${e.source}-${e.target}`,
          source: typeof e.source === 'object' ? e.source.id : e.source,
          target: typeof e.target === 'object' ? e.target.id : e.target,
          label: e.type || e.relationship,
          animated: e.type === 'TARGETS' || e.type === 'HAS_SKILL',
          style: { stroke: '#4f46e5', strokeWidth: 1.5 },
          labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 600 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' },
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.id, setNodes, setEdges]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node.data.raw);
  }, []);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={loadGraph} />;

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-6rem)]">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Network className="w-6 h-6 text-indigo-400" /> Your Career Graph
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Live topological visualization of your skills, projects, career goals, and opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" icon={RefreshCw} onClick={loadGraph}>
            Reset View
          </Button>
        </div>
      </div>

      {/* ─── Graph Canvas ────────────────────────────────────────────────── */}
      <Card className="flex-1 relative overflow-hidden bg-slate-950 border-slate-800 flex flex-col">
        {/* Node Legend */}
        <div className="absolute top-4 left-4 z-10 p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex flex-wrap gap-2 text-[11px] shadow-lg max-w-md">
          {Object.entries(nodeColors).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950/80">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.bg }} />
              <span className="text-slate-300 font-medium">{cfg.label}</span>
            </div>
          ))}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          className="w-full h-full"
        >
          <Background color="#1e1e38" gap={20} size={1} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-white" />
          <MiniMap
            nodeColor={(n) => {
              const raw = n.data?.raw;
              return nodeColors[raw?.label]?.bg || '#4f46e5';
            }}
            className="!bg-slate-900 !border-slate-800"
          />
        </ReactFlow>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 z-10 w-80 p-5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 shadow-2xl text-xs space-y-2 animate-slide-up">
            <div className="flex items-center justify-between">
              <Badge variant="brand" size="sm">
                {selectedNode.label || 'Entity'}
              </Badge>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-sm font-bold text-white">{selectedNode.name || selectedNode.id}</h3>
            {selectedNode.description && (
              <p className="text-slate-300 leading-relaxed text-[11px]">{selectedNode.description}</p>
            )}
            {selectedNode.proficiency && (
              <div className="text-slate-400">
                Proficiency: <strong className="text-emerald-400">{selectedNode.proficiency}</strong>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
