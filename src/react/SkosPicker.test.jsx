import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { useState } from 'react';
import SkosPicker from './SkosPicker.jsx';

afterEach(cleanup);

// A small controlled wrapper so onChange actually updates the rendered value,
// mirroring real usage.
function Controlled({ schemeId, multiple = false, initial = multiple ? [] : null, onChange }) {
  const [value, setValue] = useState(initial);
  return (
    <SkosPicker
      schemeId={schemeId}
      value={value}
      multiple={multiple}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

describe('<SkosPicker /> (React)', () => {
  it('warns on an unknown scheme', () => {
    render(<SkosPicker schemeId="Nope" value={null} onChange={() => {}} />);
    expect(screen.getByText(/Unknown SKOS scheme/i)).toBeTruthy();
  });

  it('opens the panel and lists concepts on click', () => {
    const { container } = render(<Controlled schemeId="Cuisine" />);
    fireEvent.click(container.querySelector('.skos-picker-control'));
    const options = container.querySelectorAll('.skos-picker-option');
    expect(options.length).toBeGreaterThan(0);
    // The Cuisine scheme contains "Italian".
    expect(screen.getByText('Italian')).toBeTruthy();
  });

  it('fires onChange with the concept id when an option is picked', () => {
    const onChange = vi.fn();
    const { container } = render(<Controlled schemeId="Cuisine" onChange={onChange} />);
    fireEvent.click(container.querySelector('.skos-picker-control'));
    const italian = [...container.querySelectorAll('.skos-picker-option')].find((o) =>
      o.textContent.includes('Italian')
    );
    fireEvent.mouseDown(italian);
    expect(onChange).toHaveBeenCalledWith('Italian');
  });

  it('filters the list as the user types', () => {
    const { container } = render(<Controlled schemeId="Cuisine" />);
    fireEvent.click(container.querySelector('.skos-picker-control'));
    const input = container.querySelector('.skos-picker-input');
    fireEvent.change(input, { target: { value: 'jap' } });
    const labels = [...container.querySelectorAll('.skos-picker-option')].map((o) =>
      o.textContent.trim()
    );
    expect(labels.some((l) => l.includes('Japanese'))).toBe(true);
    expect(labels.some((l) => l.includes('Italian'))).toBe(false);
  });

  it('supports multi-select: accumulates values and renders chips', () => {
    const onChange = vi.fn();
    const { container } = render(<Controlled schemeId="Music-Genre" multiple onChange={onChange} />);
    fireEvent.click(container.querySelector('.skos-picker-control'));

    // Match the option's main label span exactly (option text also includes
    // alt labels and definitions, so a substring match is ambiguous).
    const pick = (label) => {
      const opt = [...container.querySelectorAll('.skos-picker-option')].find(
        (o) => o.querySelector('.label-text')?.textContent.trim() === label
      );
      fireEvent.mouseDown(opt);
    };
    pick('Jazz');
    expect(onChange).toHaveBeenLastCalledWith(['Jazz']);
    pick('Rock');
    expect(onChange).toHaveBeenLastCalledWith(['Jazz', 'Rock']);

    // Chips reflect the two selections.
    const chips = container.querySelectorAll('.skos-chip');
    expect(chips.length).toBe(2);
  });

  it('shows an empty-state message when nothing matches', () => {
    const { container } = render(<Controlled schemeId="Cuisine" />);
    fireEvent.click(container.querySelector('.skos-picker-control'));
    fireEvent.change(container.querySelector('.skos-picker-input'), {
      target: { value: 'zzzzz' },
    });
    expect(within(container).getByText(/No concepts match/i)).toBeTruthy();
  });
});
