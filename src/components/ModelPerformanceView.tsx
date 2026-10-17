import React, { useState } from 'react';
import { BarChart3, Search, Info, HelpCircle } from 'lucide-react';
import { EVALUATION_METRICS } from '../utils/modelData';

export const ModelPerformanceView: React.FC = () => {
  const [selectedCell, setSelectedCell] = useState<{
    trueClass: string;
    predClass: string;
    count: number;
    totalTrue: number;
  } | null>(null);

  const [tableSearch, setTableSearch] = useState<string>('');
  const [sortField, setSortField] = useState<'precision' | 'recall' | 'f1_score' | 'support'>('f1_score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const classes = EVALUATION_METRICS.classes || [];
  const cm = EVALUATION_METRICS.confusion_matrix || [];
  const perClass = EVALUATION_METRICS.per_class || {};

  // Table rows with sorting
  const tableRows = classes
    .filter((c) => c.toLowerCase().includes(tableSearch.toLowerCase()))
    .map((c) => ({
      sign: c,
      precision: perClass[c]?.precision ?? 0,
      recall: perClass[c]?.recall ?? 0,
      f1_score: perClass[c]?.f1_score ?? 0,
      support: perClass[c]?.support ?? 0,
    }))
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
    });

  // Calculate row sums for confusion matrix percentages
  const rowTotals = cm.map((row) => row.reduce((acc, v) => acc + v, 0));

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          <span>Model Evaluation Performance</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Empirical evaluation results measured on an unseen 20% stratified test split across 28 sign classes
        </p>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Overall Accuracy</div>
          <div className="text-3xl font-extrabold font-mono text-cyan-400 tabular-nums">
            {(EVALUATION_METRICS.accuracy * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {EVALUATION_METRICS.test_samples} test samples evaluated
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Weighted Precision</div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
            {(EVALUATION_METRICS.precision * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Positive predictive rate
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Weighted Recall</div>
          <div className="text-3xl font-extrabold font-mono text-blue-400 tabular-nums">
            {(EVALUATION_METRICS.recall * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Sensitivity / true positive rate
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Weighted F1 Score</div>
          <div className="text-3xl font-extrabold font-mono text-purple-400 tabular-nums">
            {(EVALUATION_METRICS.f1_score * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Harmonic balance of P & R
          </div>
        </div>
      </div>

      {/* Interactive Confusion Matrix */}
      <section className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Confusion Matrix Heatmap</span>
              <span className="text-xs font-mono text-cyan-400 font-normal">(28 × 28 Classes)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Y-axis represents True Sign; X-axis represents Predicted Sign. Diagonal cells show correct classifications.
            </p>
          </div>

          {selectedCell && (
            <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/80 px-3 py-1.5 rounded">
              True: <strong className="text-white">{selectedCell.trueClass}</strong> → Predicted:{' '}
              <strong className="text-white">{selectedCell.predClass}</strong> ({selectedCell.count} /{' '}
              {selectedCell.totalTrue} samples,{' '}
              {((selectedCell.count / Math.max(1, selectedCell.totalTrue)) * 100).toFixed(1)}%)
            </div>
          )}
        </div>

        {/* Matrix Grid Container */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-[720px] select-none">
            {/* Column Header (Predicted Classes) */}
            <div className="flex pl-10 text-[10px] font-mono text-slate-400 font-bold mb-1">
              <span className="w-10 text-center text-slate-500">True\Pred</span>
              {classes.map((c) => (
                <div key={c} className="w-6 sm:w-7 text-center truncate">
                  {c.length > 2 ? c[0] : c}
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            {classes.map((trueCls, rowIdx) => {
              const rowSum = rowTotals[rowIdx] || 1;
              return (
                <div key={trueCls} className="flex items-center text-[10px] font-mono">
                  {/* Row Label (True Class) */}
                  <div className="w-10 text-right pr-2 text-slate-400 font-bold truncate">
                    {trueCls}
                  </div>

                  {/* Cells */}
                  {classes.map((predCls, colIdx) => {
                    const count = cm[rowIdx]?.[colIdx] ?? 0;
                    const isDiagonal = rowIdx === colIdx;
                    const ratio = count / rowSum;

                    // Compute background color intensity
                    let cellBg = 'bg-slate-950/80 border-slate-900';
                    let textColor = 'text-slate-600';

                    if (count > 0) {
                      if (isDiagonal) {
                        if (ratio >= 0.8) {
                          cellBg = 'bg-cyan-600/90 text-white font-bold';
                        } else if (ratio >= 0.5) {
                          cellBg = 'bg-cyan-700/70 text-cyan-100';
                        } else {
                          cellBg = 'bg-cyan-900/60 text-cyan-200';
                        }
                        textColor = 'text-white';
                      } else {
                        // Misclassification cell
                        cellBg = 'bg-rose-950/70 border-rose-900/60 text-rose-300';
                        textColor = 'text-rose-300 font-semibold';
                      }
                    }

                    return (
                      <button
                        key={predCls}
                        onMouseEnter={() =>
                          setSelectedCell({
                            trueClass: trueCls,
                            predClass: predCls,
                            count,
                            totalTrue: rowSum,
                          })
                        }
                        onClick={() =>
                          setSelectedCell({
                            trueClass: trueCls,
                            predClass: predCls,
                            count,
                            totalTrue: rowSum,
                          })
                        }
                        className={`w-6 h-6 sm:w-7 sm:h-7 border border-slate-900/80 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 hover:z-20 ${cellBg}`}
                        title={`True: ${trueCls} | Pred: ${predCls} | Count: ${count}`}
                      >
                        <span className={textColor}>{count > 0 ? count : '·'}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Matrix Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-cyan-600 border border-cyan-500" />
            <span>High Correct Match (&ge;80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-cyan-800 border border-cyan-700" />
            <span>Moderate Match (50%–79%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-950 border border-rose-800" />
            <span>Misclassification Confusion</span>
          </div>
        </div>
      </section>

      {/* Per-Class Classification Report Table */}
      <section className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-100">Per-Class Detailed Classification Report</h2>
            <p className="text-xs text-slate-400">Precision, recall, F1 score, and support count for each ASL gesture</p>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filter signs..."
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Sign Class</th>
                <th
                  onClick={() => {
                    setSortField('precision');
                    setSortAsc(sortField === 'precision' ? !sortAsc : false);
                  }}
                  className="py-2.5 px-4 font-semibold cursor-pointer hover:text-white"
                >
                  Precision {sortField === 'precision' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => {
                    setSortField('recall');
                    setSortAsc(sortField === 'recall' ? !sortAsc : false);
                  }}
                  className="py-2.5 px-4 font-semibold cursor-pointer hover:text-white"
                >
                  Recall {sortField === 'recall' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => {
                    setSortField('f1_score');
                    setSortAsc(sortField === 'f1_score' ? !sortAsc : false);
                  }}
                  className="py-2.5 px-4 font-semibold cursor-pointer hover:text-white text-cyan-400"
                >
                  F1 Score {sortField === 'f1_score' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => {
                    setSortField('support');
                    setSortAsc(sortField === 'support' ? !sortAsc : false);
                  }}
                  className="py-2.5 px-4 font-semibold cursor-pointer hover:text-white"
                >
                  Support {sortField === 'support' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/20">
              {tableRows.map((row) => (
                <tr key={row.sign} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-4 font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400">
                      {row.sign}
                    </span>
                    <span>Sign {row.sign}</span>
                  </td>
                  <td className="py-2 px-4 tabular-nums text-slate-300">
                    {(row.precision * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-4 tabular-nums text-slate-300">
                    {(row.recall * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-4 tabular-nums font-bold text-cyan-400">
                    {(row.f1_score * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-4 tabular-nums text-slate-400">
                    {row.support}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
