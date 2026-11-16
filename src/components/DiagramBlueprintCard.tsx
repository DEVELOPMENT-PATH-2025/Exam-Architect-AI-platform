import { useMemo } from 'react';
import { PenLine, CheckSquare } from 'lucide-react';
import { cn } from '../lib/utils';

export interface DiagramBlueprintData {
  title?: string;
  layout?: string;
  nodes?: string[];
  labelsToDraw?: string[];
}

interface DiagramBlueprintCardProps {
  questionText: string;
  subjectName: string;
  keywords?: string[];
  blueprint?: DiagramBlueprintData;
  variant?: 'coach' | 'ideal';
}

function inferBlueprint(
  questionText: string,
  subjectName: string,
  keywords: string[] = [],
  blueprint?: DiagramBlueprintData
) {
  if (
    blueprint &&
    blueprint.title &&
    Array.isArray(blueprint.nodes) &&
    blueprint.nodes.length >= 3
  ) {
    return {
      title: blueprint.title,
      layout: (blueprint.layout || 'pipeline').toLowerCase(),
      nodes: blueprint.nodes.slice(0, 4),
      labelsToDraw:
        Array.isArray(blueprint.labelsToDraw) && blueprint.labelsToDraw.length > 0
          ? blueprint.labelsToDraw.slice(0, 4)
          : blueprint.nodes.slice(0, 4)
    };
  }

  const q = `${questionText} ${subjectName}`.toLowerCase();

  if (q.includes('data independence') || q.includes('3-schema') || q.includes('three schema')) {
    return {
      title: 'Three-Level Schema & Data Independence Diagram',
      layout: 'layered',
      nodes: [
        'External Level (User Views)',
        'Conceptual Schema (Logical Structure)',
        'Internal Schema (Physical Storage)'
      ],
      labelsToDraw: [
        'Logical Data Independence (External ↔ Conceptual)',
        'Physical Data Independence (Conceptual ↔ Internal)',
        'Stored Database Disk'
      ]
    };
  }

  if (q.includes('turing machine')) {
    return {
      title: 'Turing Machine Block Schematic',
      layout: 'pipeline',
      nodes: ['Infinite Input Tape', 'Read/Write Head', 'Finite State Control', 'Transition δ(q, a)'],
      labelsToDraw: ['Blank Symbol (B)', 'Head Direction (L / R)', 'Accept / Halt State']
    };
  }

  if (q.includes('dfa') || q.includes('nfa') || q.includes('automata') || q.includes('finite')) {
    return {
      title: 'Finite Automaton State Transition Diagram',
      layout: 'cycle',
      nodes: ['Start State (q0)', 'Intermediate (q1)', 'Transition δ', 'Final State ((qf))'],
      labelsToDraw: ['Initial Arrow (→)', 'Double Circle Final State', 'Input Symbols (0, 1)']
    };
  }

  if (q.includes('deadlock') || q.includes('banker') || q.includes('process') || q.includes('scheduling')) {
    return {
      title: 'OS Resource / Process State Flow',
      layout: 'cycle',
      nodes: ['New / Ready Queue', 'CPU Dispatch', 'Resource Wait / Lock', 'Completion / Release'],
      labelsToDraw: ['Context Switch', 'Allocation Edge (R → P)', 'Request Edge (P → R)']
    };
  }

  if (q.includes('compare') || q.includes('contrast') || q.includes('versus') || q.includes('trade-off')) {
    return {
      title: 'Comparative Architecture Schematic',
      layout: 'comparison',
      nodes: [
        keywords[0] || 'Approach A (Static/Baseline)',
        keywords[1] || 'Approach B (Dynamic/Optimized)',
        'Throughput / Space-Time Tradeoff'
      ],
      labelsToDraw: [
        'Input Workload Parameters',
        'Key Structural Difference',
        'Complexity / Overhead Bound'
      ]
    };
  }

  if (q.includes('architecture') || q.includes('layer') || q.includes('hierarchy') || q.includes('memory')) {
    return {
      title: `${subjectName} Layered Architecture Diagram`,
      layout: 'layered',
      nodes: [
        keywords[0] ? `${keywords[0]} Interface` : 'Top Interface Layer',
        keywords[1] ? `${keywords[1]} Engine` : 'Core Processing Logic',
        keywords[2] ? `${keywords[2]} Storage` : 'Physical / Control Layer'
      ],
      labelsToDraw: [
        'Control & Data Flow Arrows',
        ...(keywords.slice(0, 2).length > 0 ? keywords.slice(0, 2) : ['Validation Boundary', 'Resource Layer'])
      ]
    };
  }

  return {
    title: `${subjectName} Conceptual Block Diagram`,
    layout: 'pipeline',
    nodes: [
      'Input / Preconditions',
      keywords[0] || 'Core Mechanism',
      keywords[1] || 'Control / Optimization',
      'Verified Output'
    ],
    labelsToDraw:
      keywords.length >= 3
        ? keywords.slice(0, 3)
        : ['Directional Arrows', 'Key Parameters', 'Output Invariant']
  };
}

export default function DiagramBlueprintCard({
  questionText,
  subjectName,
  keywords = [],
  blueprint,
  variant = 'coach'
}: DiagramBlueprintCardProps) {
  const resolved = useMemo(
    () => inferBlueprint(questionText, subjectName, keywords, blueprint),
    [questionText, subjectName, keywords, blueprint]
  );

  const isIdeal = variant === 'ideal';
  const nodes = resolved.nodes;

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 sm:p-5 space-y-3.5',
        isIdeal
          ? 'bg-indigo-50/40 border-indigo-200/80'
          : 'bg-white border-slate-200 shadow-xs'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center border',
              isIdeal
                ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                : 'bg-blue-50 text-blue-600 border-blue-100'
            )}
          >
            <PenLine className="w-3.5 h-3.5" />
          </div>
          <div>
            <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
              {isIdeal ? 'Exam-Copy Diagram Sketch' : 'Must-Draw Diagram Blueprint'}
            </h5>
            <p className="text-[10px] font-semibold text-slate-500">{resolved.title}</p>
          </div>
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          +1.5 Marks Visual Boost
        </span>
      </div>

      {/* Crisp Vector SVG Blueprint */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 overflow-x-auto">
        {resolved.layout === 'layered' ? (
          <svg viewBox="0 0 360 154" className="w-full max-w-md mx-auto h-auto" role="img" aria-label={resolved.title}>
            <defs>
              <marker id="diag-arrow-down" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
              </marker>
            </defs>
            {nodes.slice(0, 3).map((label, idx) => {
              const y = 8 + idx * 52;
              const fills = ['#eff6ff', '#eef2ff', '#ecfdf5'];
              const strokes = ['#3b82f6', '#6366f1', '#10b981'];
              return (
                <g key={idx}>
                  <rect
                    x="30"
                    y={y}
                    width="300"
                    height="32"
                    rx="7"
                    fill={fills[idx % fills.length]}
                    stroke={strokes[idx % strokes.length]}
                    strokeWidth="1.5"
                  />
                  <text
                    x="180"
                    y={y + 19}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="700"
                    fill="#0f172a"
                    fontFamily="sans-serif"
                  >
                    {label.length > 42 ? `${label.slice(0, 39)}...` : label}
                  </text>
                  {idx < 2 && (
                    <line
                      x1="180"
                      y1={y + 32}
                      x2="180"
                      y2={y + 49}
                      stroke="#2563eb"
                      strokeWidth="1.6"
                      markerEnd="url(#diag-arrow-down)"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        ) : resolved.layout === 'comparison' ? (
          <svg viewBox="0 0 380 128" className="w-full max-w-md mx-auto h-auto" role="img" aria-label={resolved.title}>
            <rect x="14" y="12" width="154" height="44" rx="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="91" y="37" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a" fontFamily="sans-serif">
              {(nodes[0] || 'Approach A').slice(0, 22)}
            </text>
            <rect x="212" y="12" width="154" height="44" rx="8" fill="#eef2ff" stroke="#6366f1" strokeWidth="1.5" />
            <text x="289" y="37" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a" fontFamily="sans-serif">
              {(nodes[1] || 'Approach B').slice(0, 22)}
            </text>
            <text x="190" y="38" textAnchor="middle" fontSize="10" fontWeight="900" fill="#64748b" fontFamily="sans-serif">
              VS
            </text>
            <line x1="91" y1="56" x2="150" y2="82" stroke="#475569" strokeWidth="1.4" strokeDasharray="3 2" />
            <line x1="289" y1="56" x2="230" y2="82" stroke="#475569" strokeWidth="1.4" strokeDasharray="3 2" />
            <rect x="70" y="82" width="240" height="34" rx="8" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
            <text x="190" y="102" textAnchor="middle" fontSize="10" fontWeight="700" fill="#065f46" fontFamily="sans-serif">
              {(nodes[2] || 'Trade-off Matrix & Complexity').slice(0, 34)}
            </text>
          </svg>
        ) : resolved.layout === 'cycle' ? (
          <svg viewBox="0 0 380 120" className="w-full max-w-md mx-auto h-auto" role="img" aria-label={resolved.title}>
            <defs>
              <marker id="cycle-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
              </marker>
            </defs>
            {nodes.slice(0, 4).map((label, idx) => {
              const positions = [
                { cx: 52, cy: 60 },
                { cx: 145, cy: 30 },
                { cx: 238, cy: 30 },
                { cx: 328, cy: 60 }
              ];
              const p = positions[idx];
              const isFinal = idx === 3;
              return (
                <g key={idx}>
                  <rect
                    x={p.cx - 40}
                    y={p.cy - 18}
                    width="80"
                    height="36"
                    rx="18"
                    fill={isFinal ? '#ecfdf5' : '#eff6ff'}
                    stroke={isFinal ? '#10b981' : '#3b82f6'}
                    strokeWidth={isFinal ? '2.2' : '1.5'}
                  />
                  <text x={p.cx} y={p.cy + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f172a" fontFamily="sans-serif">
                    {label.length > 14 ? `${label.slice(0, 13)}…` : label}
                  </text>
                </g>
              );
            })}
            <line x1="88" y1="48" x2="108" y2="38" stroke="#2563eb" strokeWidth="1.5" markerEnd="url(#cycle-arrow)" />
            <line x1="185" y1="30" x2="198" y2="30" stroke="#2563eb" strokeWidth="1.5" markerEnd="url(#cycle-arrow)" />
            <line x1="274" y1="38" x2="294" y2="48" stroke="#2563eb" strokeWidth="1.5" markerEnd="url(#cycle-arrow)" />
            <path d="M 328 78 Q 190 112 56 78" fill="none" stroke="#64748b" strokeWidth="1.3" strokeDasharray="4 3" markerEnd="url(#cycle-arrow)" />
          </svg>
        ) : (
          <svg viewBox="0 0 400 76" className="w-full max-w-lg mx-auto h-auto" role="img" aria-label={resolved.title}>
            <defs>
              <marker id="pipe-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
              </marker>
            </defs>
            {nodes.slice(0, 4).map((label, idx) => {
              const x = 8 + idx * 98;
              const isLast = idx === Math.min(nodes.length, 4) - 1;
              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y="16"
                    width="82"
                    height="44"
                    rx="8"
                    fill={isLast ? '#ecfdf5' : '#eff6ff'}
                    stroke={isLast ? '#10b981' : '#3b82f6'}
                    strokeWidth="1.5"
                  />
                  <text
                    x={x + 41}
                    y="41"
                    textAnchor="middle"
                    fontSize="8.8"
                    fontWeight="700"
                    fill="#0f172a"
                    fontFamily="sans-serif"
                  >
                    {label.length > 14 ? `${label.slice(0, 13)}…` : label}
                  </text>
                  {!isLast && (
                    <line
                      x1={x + 82}
                      y1="38"
                      x2={x + 96}
                      y2="38"
                      stroke="#2563eb"
                      strokeWidth="1.6"
                      markerEnd="url(#pipe-arrow)"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Labels Student Must Mark */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <CheckSquare className="w-3 h-3 text-blue-600" />
          <span>Labels to Mark on Exam Paper:</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {resolved.labelsToDraw.map((lbl, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700"
            >
              {lbl}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
