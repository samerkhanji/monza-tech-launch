import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedTableProps<T> {
  data: T[];
  columns: {
    key: string;
    header: string;
    width?: number;
    render: (item: T) => React.ReactNode;
  }[];
  height?: number;
  rowHeight?: number;
  className?: string;
}

export function VirtualizedTable<T>({
  data,
  columns,
  height = 400,
  rowHeight = 50,
  className = ''
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  useEffect(() => {
    if (parentRef.current) {
      setTableWidth(parentRef.current.offsetWidth);
    }
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 150, []),
    overscan: 2,
  });

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: `${columnVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'white',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              height: `${rowHeight}px`,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
              const column = columns[virtualColumn.index];
              return (
                <div
                  key={virtualColumn.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${virtualColumn.size}px`,
                    transform: `translateX(${virtualColumn.start}px)`,
                    padding: '0 12px',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#374151',
                  }}
                >
                  {column.header}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rows */}
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = data[virtualRow.index];
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
                const column = columns[virtualColumn.index];
                return (
                  <div
                    key={virtualColumn.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `${virtualColumn.size}px`,
                      transform: `translateX(${virtualColumn.start}px)`,
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {column.render(item)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
} 