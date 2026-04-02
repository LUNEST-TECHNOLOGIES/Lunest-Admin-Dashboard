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
    <div className="bg-white rounded-lg shadow-md border border-stone-300 p-4 sm:p-6">
      {/* Header */}
      {title && (
        <h3 className="font-aeonik font-bold text-base sm:text-lg text-indigo-900 mb-4">
          {title}
        </h3>
      )}

      {/* Search Bar */}
      {searchable && (
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(0);
          }}
          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg font-aeonik font-medium text-sm mb-4"
        />
      )}

      {/* Table - Scrollable on small screens */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 sm:rounded-lg">
        <table className="w-full min-w-max sm:min-w-0">
          {/* Header */}
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-3 text-left font-aeonik font-bold text-sm text-slate-900 ${
                    col.sortable ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortable && col.sortable && sortConfig?.key === col.key && (
                      <span className="w-4 h-4 flex items-center justify-center">
                        {sortConfig.direction === 'asc' ? <SortUpIcon /> : <SortDownIcon />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right font-aeonik font-bold text-sm">Actions</th>}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-gray-200 ${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                >
                  {columns.map(col => (
                    <td
                      key={`${rowIndex}-${col.key}`}
                      className="px-4 py-3 font-aeonik font-medium text-sm text-slate-700"
                    >
                      {renderCell
                        ? renderCell(row, col.key, row[col.key])
                        : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        {actions.map((action, idx) => {
                          let Icon = ViewIcon;
                          if (action.type === 'edit') Icon = EditIcon;
                          else if (action.type === 'delete') Icon = DeleteIcon;
                          else if (action.type === 'view') Icon = ViewIcon;
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => action.onClick?.(row)}
                              className={`p-1.5 rounded transition ${
                                action.type === 'delete'
                                  ? 'text-red-600 hover:bg-red-50'
                                  : action.type === 'edit'
                                  ? 'text-blue-600 hover:bg-blue-50'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              title={action.label}
                            >
                              <div className="w-5 h-5 flex items-center justify-center">
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
                  className="px-4 py-8 text-center font-aeonik font-medium text-slate-500"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <p className="font-aeonik font-medium text-sm text-slate-600">
            Page {currentPage + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1 border border-gray-300 rounded font-aeonik font-medium text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1 border border-gray-300 rounded font-aeonik font-medium text-sm disabled:opacity-50"
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
