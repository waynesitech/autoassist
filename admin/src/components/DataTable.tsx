import { ReactNode } from 'react';
import './DataTable.css';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  loading?: boolean;
}

const DataTable = ({ columns, data, onEdit, onDelete, onView, loading }: DataTableProps) => {
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="empty-state">No data available</div>;
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            {(onEdit || onDelete || onView) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]?.toString() || '-'}
                </td>
              ))}
              {(onEdit || onDelete || onView) && (
                <td className="actions-cell">
                  {onView && (
                    <button className="btn-view" onClick={() => onView(row)}>
                      View
                    </button>
                  )}
                  {onEdit && (
                    <button className="btn-edit" onClick={() => onEdit(row)}>
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button className="btn-delete" onClick={() => onDelete(row)}>
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

