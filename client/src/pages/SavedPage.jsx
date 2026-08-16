import React, { useState, useEffect } from 'react';
import { Bookmark, Briefcase, Compass, BookOpen, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import * as api from '../services/api';

const TAB_CONFIG = [
  { id: 'careers', label: 'Careers',   icon: Compass },
  { id: 'jobs',    label: 'Jobs',      icon: Briefcase },
  { id: 'courses', label: 'Courses',   icon: BookOpen },
];

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState('careers');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getSavedItems()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((i) => i.type === activeTab);

  const handleUnsave = async (savedId) => {
    await api.unsaveItem(savedId).catch(() => {});
    setItems((prev) => prev.filter((i) => i.id !== savedId));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Saved Items</h1>
        <p className="section-subtitle mt-1">Your bookmarked careers, jobs, and courses</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === id ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className="badge badge-gray text-xs">{items.filter((i) => i.type === id).length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="skeleton h-4 w-1/3 mb-2" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            No saved {activeTab} yet
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Browse {activeTab} and click the bookmark icon to save them here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id} className="p-5 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.name || item.title}</div>
                {item.subtitle && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.subtitle}</div>}
              </div>
              <button
                onClick={() => handleUnsave(item.id)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                aria-label="Remove from saved"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
