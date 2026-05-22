import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import SkosPicker from '../src/react/SkosPicker.jsx';
import '../src/react/skos-picker.css';

function Demo() {
  const [language, setLanguage] = useState('TypeScript');
  const [cuisine, setCuisine] = useState(null);
  const [genres, setGenres] = useState([]);

  return (
    <>
      <h1>&lt;SkosPicker&gt;</h1>
      <p className="sub">React component — same UX as the vanilla web component.</p>

      <div className="field">
        <label>Programming Language (single, with notation badges)</label>
        <SkosPicker
          schemeId="Programming-Language"
          value={language}
          onChange={setLanguage}
          placeholder="Pick a language…"
        />
        <div className="value">value: <code>{JSON.stringify(language)}</code></div>
      </div>

      <div className="field">
        <label>Cuisine (single, grouped by region)</label>
        <SkosPicker
          schemeId="Cuisine"
          value={cuisine}
          onChange={setCuisine}
          minChars={1}
        />
        <div className="value">value: <code>{JSON.stringify(cuisine)}</code></div>
      </div>

      <div className="field">
        <label>Music Genres (multi-select)</label>
        <SkosPicker
          schemeId="Music-Genre"
          value={genres}
          onChange={setGenres}
          multiple
        />
        <div className="value">value: <code>{JSON.stringify(genres)}</code></div>
      </div>
    </>
  );
}

createRoot(document.getElementById('root')).render(<Demo />);
