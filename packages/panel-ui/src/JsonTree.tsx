import { forwardRef, type JSX, useMemo } from 'react';
import { TIP_TREE_STYLE } from './styles';
import { formatLeaf, previewValue, truncate } from './json-tree-utils';

type JsonTreeProps = {
  data: any;
};

function buildJsonNodes(
  key: string,
  value: any,
  depth: number,
  visited: WeakSet<object>,
): JSX.Element[] {
  const elements: JSX.Element[] = [];
  const isObj = value && typeof value === 'object';
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

  const size = isArr ? value.length : Object.keys(value).length;
  const preview = truncate(JSON.stringify(previewValue(value)), 120);
  const summaryLabel = `${key ? `${JSON.stringify(key)}: ` : ''}${
    isArr ? `Array(${size})` : 'Object'
  } ${preview}`;

  const children: JSX.Element[] = [];
  if (isArr) {
    for (let i = 0; i < value.length; i++) {
      children.push(...buildJsonNodes(String(i), value[i], depth + 1, visited));
    }
  } else {
    for (const k of Object.keys(value)) {
      children.push(...buildJsonNodes(k, value[k], depth + 1, visited));
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

const JsonTree = forwardRef<HTMLDivElement, JsonTreeProps>(function JsonTree(
  { data },
  ref,
) {
  const nodes = useMemo(() => buildJsonNodes('', data, 0, new WeakSet()), [data]);
  return (
    <div ref={ref} style={TIP_TREE_STYLE}>
      {nodes}
    </div>
  );
});

export default JsonTree;
