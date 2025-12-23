import React from '../react';
import { LEGEND_STYLE } from '../styles';

export function Legend() {
  return (
    <div style={LEGEND_STYLE}>
      Tip: hover for data • click to pin • wheel to zoom Y • drag to pan • Space Play/Pause •
      Shapes: triangle=subscribe/create, circle=next, line=complete/unsubscribe, x=error
    </div>
  );
}
