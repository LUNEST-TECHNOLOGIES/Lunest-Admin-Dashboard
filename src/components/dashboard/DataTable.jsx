import React, { useState } from 'react';
import { EditIcon, DeleteIcon, ViewIcon, SortUpIcon, SortDownIcon } from '../AllIcons';

/**
 * DataTable Component - Flexible data table for displaying lists
 * 
 * Features:
 * - Sortable columns
 * - Custom cell rendering
 * - Pagination support
 * - Responsive design
 * - Search/filter support
 * - Action buttons
 * 
 * @component
 * @example
 * const columns = [
 *   { key: 'name', label: 'Name', sortable: true },
 *   { key: 'email', label: 'Email' },
 *   { key: 'status', label: 'Status' },
 * ];
 * 
 * <DataTable columns={columns} data={data} />
 */
export default function DataTable({
  columns = [],
  data = [],
  title,
  searchable = false,
  sortable = true,
  paginated = false,
  itemsPerPage = 10,
  onRowClick,
  renderCell,
  actions,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Filter data based on search
  const filteredData = searchable
    ? data.filter(row =>
        columns.some(col =>
          String(row[col.key])
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      )
    : data;

  // Sort data
  const sortedData = sortable && sortConfig
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;

  // Paginate data
  const paginatedData = paginated
    ? sortedData.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
      )
    : sortedData;

  // Total pages
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig(prev =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-6 space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {title && (
          <h3 className="font-aeonik font-bold text-base sm:text-lg text-slate-900 tracking-tight">
            {title}
          </h3>
        )}

        {searchable && (
          <div className="relative sm:w-64">
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl font-aeonik font-medium text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-xs"
            />
          </div>
        )}
      </div>

      {/* Table - Scrollable */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead className="bg-slate-50/80 border-b border-slate-100">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-3 font-aeonik font-bold text-xs uppercase tracking-wider text-slate-500 ${
                    col.sortable ? 'cursor-pointer hover:bg-slate-100/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {sortable && col.sortable && sortConfig?.key === col.key && (
                      <span className="w-3.5 h-3.5 flex items-center justify-center text-indigo-600">
                        {sortConfig.direction === 'asc' ? <SortUpIcon /> : <SortDownIcon />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right font-aeonik font-bold text-xs uppercase tracking-wider text-slate-500">Actions</th>}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map(col => (
                    <td
                      key={`${rowIndex}-${col.key}`}
                      className="px-4 py-3 font-aeonik font-medium text-xs text-slate-700 whitespace-nowrap"
                    >
                      {renderCell
                        ? renderCell(row, col.key, row[col.key])
                        : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {actions.map((action, idx) => {
                          let Icon = ViewIcon;
                          if (action.type === 'edit') Icon = EditIcon;
                          else if (action.type === 'delete') Icon = DeleteIcon;
                          else if (action.type === 'view') Icon = ViewIcon;
                          
                          return (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick?.(row);
                              }}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                action.type === 'delete'
                                  ? 'text-rose-600 hover:bg-rose-50'
                                  : action.type === 'edit'
                                  ? 'text-indigo-600 hover:bg-indigo-50'
                                  : 'text-slate-500 hover:bg-slate-100'
                              }`}
                              title={action.label}
                            >
                              <div className="w-4 h-4 flex items-center justify-center">
                                <Icon />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-10 text-center font-aeonik font-medium text-xs text-slate-400"
                >
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="font-aeonik font-medium text-xs text-slate-500">
            Page <span className="font-bold text-slate-900">{currentPage + 1}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1.5 border border-slate-200 rounded-xl font-aeonik font-bold text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1.5 border border-slate-200 rounded-xl font-aeonik font-bold text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Sample data generator
 */
export const generateSampleTableData = (count = 10) => {
  const firstNames = ['Tom', 'Sarah', 'John', 'Michael', 'Emma'];
  const lastNames = ['Hilfiger', 'Anderson', 'Doe', 'Johnson', 'Martinez'];
  const statuses = ['Active', 'Pending', 'Completed', 'Cancelled'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    email: `user${i + 1}@example.com`,
    status: statuses[i % statuses.length],
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      .toLocaleDateString(),
  }));
};
