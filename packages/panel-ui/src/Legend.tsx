import { useEffect, useRef, useState } from 'react';
import {
  LEGEND_HINT_STYLE,
  LEGEND_ITEM_STYLE,
  LEGEND_KBD_STYLE,
  LEGEND_POPOVER_STYLE,
  LEGEND_POPOVER_WRAP_STYLE,
  LEGEND_SECTION_STYLE,
  LEGEND_SECTION_TITLE_STYLE,
  LEGEND_STYLE,
  LEGEND_TRIGGER_STYLE,
} from './styles';

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  if (element.isContentEditable) return true;

  const tagName = element.tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}

export function Legend() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (wrapRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }

      if (event.key !== '?' || isEditableTarget(event.target)) return;
      event.preventDefault();
      setOpen((prev) => !prev);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div style={LEGEND_STYLE}>
      <span style={LEGEND_HINT_STYLE}>
        Press <span style={LEGEND_KBD_STYLE}>?</span> for shortcuts
      </span>
      <div ref={wrapRef} style={LEGEND_POPOVER_WRAP_STYLE}>
        <button
          type="button"
          style={LEGEND_TRIGGER_STYLE}
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="Show timeline help"
        >
          Help
        </button>
        {open ? (
          <div style={LEGEND_POPOVER_STYLE} role="dialog" aria-label="Timeline help and shortcuts">
            <div style={LEGEND_SECTION_STYLE}>
              <div style={LEGEND_SECTION_TITLE_STYLE}>Inspect</div>
              <div style={LEGEND_ITEM_STYLE}>Hover a marble to preview details.</div>
              <div style={LEGEND_ITEM_STYLE}>Click a marble to pin it.</div>
            </div>
            <div style={LEGEND_SECTION_STYLE}>
              <div style={LEGEND_SECTION_TITLE_STYLE}>Navigate</div>
              <div style={LEGEND_ITEM_STYLE}>Drag to pan X/Y.</div>
              <div style={LEGEND_ITEM_STYLE}>Wheel or use +/- buttons to zoom X.</div>
            </div>
            <div style={LEGEND_SECTION_STYLE}>
              <div style={LEGEND_SECTION_TITLE_STYLE}>Shortcuts</div>
              <div style={LEGEND_ITEM_STYLE}>
                <span style={LEGEND_KBD_STYLE}>Space</span> Play/Pause
              </div>
              <div style={LEGEND_ITEM_STYLE}>
                <span style={LEGEND_KBD_STYLE}>Esc</span> Close help
              </div>
            </div>
            <div style={LEGEND_SECTION_STYLE}>
              <div style={LEGEND_SECTION_TITLE_STYLE}>Glyphs</div>
              <div style={LEGEND_ITEM_STYLE}>Triangle = subscribe/create</div>
              <div style={LEGEND_ITEM_STYLE}>Circle = next</div>
              <div style={LEGEND_ITEM_STYLE}>Line = complete/unsubscribe</div>
              <div style={LEGEND_ITEM_STYLE}>X = error</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
