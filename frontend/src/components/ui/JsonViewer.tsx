import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function JsonViewer({
  data,
  name,
  isLast = true,
  defaultExpanded = true,
  level = 0
}: {
  data: any;
  name?: string | number;
  isLast?: boolean;
  defaultExpanded?: boolean;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const type = data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data;

  if (type === 'object' || type === 'array') {
    const isArray = type === 'array';
    const keys = Object.keys(data || {});
    const isEmpty = keys.length === 0;

    return (
      <div className="font-mono text-[11px]" style={{ paddingLeft: level === 0 ? 0 : '1rem' }}>
        <div 
          className="flex items-center cursor-pointer hover:bg-zinc-800/50 rounded px-1 -ml-1 py-0.5"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="w-4 h-4 mr-1 flex items-center justify-center text-zinc-500">
            {!isEmpty && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </span>
          {name !== undefined && (
            <span className="text-blue-400 mr-2">{name}:</span>
          )}
          <span className="text-zinc-500 mr-2 italic">{isArray ? 'Array' : 'Object'}</span>
          <span className="text-zinc-400">{isEmpty ? (isArray ? '[]' : '{}') : (isArray ? '[' : '{')}</span>
        </div>
        
        {expanded && !isEmpty && (
          <div>
            {keys.map((key, index) => (
              <JsonViewer
                key={key}
                name={isArray ? undefined : key}
                data={data[key as keyof typeof data]}
                isLast={index === keys.length - 1}
                level={level + 1}
                defaultExpanded={defaultExpanded}
              />
            ))}
          </div>
        )}
        
        {expanded && !isEmpty && (
          <div className="text-zinc-400" style={{ paddingLeft: '1.25rem' }}>
            {isArray ? ']' : '}'}{!isLast ? ',' : ''}
          </div>
        )}
      </div>
    );
  }

  // Primitive types
  let displayValue = String(data);
  let colorClass = 'text-green-400';

  if (type === 'string') {
    displayValue = `"${data}"`;
    colorClass = 'text-green-400';
  } else if (type === 'number') {
    colorClass = 'text-amber-400';
  } else if (type === 'boolean') {
    colorClass = 'text-purple-400';
  } else if (type === 'null') {
    displayValue = 'null';
    colorClass = 'text-zinc-500';
  }

  return (
    <div className="font-mono text-[11px] py-0.5 flex items-start" style={{ paddingLeft: level === 0 ? '0.5rem' : '1.25rem' }}>
      {name !== undefined && (
        <span className="text-blue-400 mr-2 whitespace-nowrap">{name}:</span>
      )}
      <span className={`${colorClass} mr-2 break-all`}>{displayValue}</span>
      <span className="text-zinc-500 text-[10px] italic whitespace-nowrap">{type}</span>
      {!isLast && <span className="text-zinc-400">,</span>}
    </div>
  );
}
