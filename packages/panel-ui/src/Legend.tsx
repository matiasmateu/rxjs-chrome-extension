import { LEGEND_STYLE } from './styles';

export function Legend() {
  return (
    <div style={LEGEND_STYLE}>
      Tip: hover for data • click to pin • drag to pan X/Y • wheel/pinch or +/- to zoom X • Space
      Play/Pause • Observable shapes: triangle=subscribe/create, circle=next,
      line=complete/unsubscribe, x=error • Epic invocation shapes: diamond/square variants
    </div>
  );
}
