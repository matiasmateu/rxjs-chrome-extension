import { forwardRef, type JSX, useMemo } from 'react';
import { TIP_TREE_STYLE } from './styles';
import { formatLeaf, previewValue, truncate } from './json-tree-utils';

type JsonTreeProps = {
  data: unknown;
};

function buildJsonNodes(
  key: string,
  value: unknown,
  depth: number,
  visited: WeakSet<object>,
): JSX.Element[] {
  const elements: JSX.Element[] = [];
  const isObj = value != null && typeof value === 'object';
  const isArr = Array.isArray(value);

  if (!isObj) {
    const label = key ? `${JSON.stringify(key)}: ${formatLeaf(value)}` : formatLeaf(value);
    elements.push(
      <div key={key || 'leaf'} style={{ whiteSpace: 'pre' }}>
        {label}
      </div>,
    );
    return elements;
  }

  if (visited.has(value)) {
    const label = `${JSON.stringify(key)}: <circular>`;
    elements.push(
      <div key={`${key || 'root'}-circular`} style={{ whiteSpace: 'pre' }}>
        {label}
      </div>,
    );
    return elements;
  }
  visited.add(value);

  const arrayValue = isArr ? value : null;
  const objectValue = !isArr ? (value as Record<string, unknown>) : null;
  const size = arrayValue ? arrayValue.length : Object.keys(objectValue || {}).length;
  const preview = truncate(JSON.stringify(previewValue(value)), 120);
  const summaryLabel = `${key ? `${JSON.stringify(key)}: ` : ''}${
    isArr ? `Array(${size})` : 'Object'
  } ${preview}`;

  const children: JSX.Element[] = [];
  if (arrayValue) {
    for (let i = 0; i < arrayValue.length; i++) {
      children.push(...buildJsonNodes(String(i), arrayValue[i], depth + 1, visited));
    }
  } else if (objectValue) {
    for (const k of Object.keys(objectValue)) {
      children.push(...buildJsonNodes(k, objectValue[k], depth + 1, visited));
    }
  }

  elements.push(
    <details key={key || 'root'} open={depth < 1}>
      <summary style={{ cursor: 'pointer' }}>{summaryLabel}</summary>
      <div
        style={{
          paddingLeft: '14px',
          borderLeft: '1px solid rgba(90,120,150,.25)',
          marginLeft: '6px',
        }}
      >
        {children}
      </div>
    </details>,
  );

  return elements;
}

const JsonTree = forwardRef<HTMLDivElement, JsonTreeProps>(function JsonTree({ data }, ref) {
  const nodes = useMemo(() => buildJsonNodes('', data, 0, new WeakSet()), [data]);
  return (
    <div ref={ref} style={TIP_TREE_STYLE}>
      {nodes}
    </div>
  );
});

export default JsonTree;
