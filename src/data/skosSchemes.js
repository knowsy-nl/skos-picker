// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Jeroen Steggink, knowsy
//
// Sample SKOS vocabularies for the <skos-picker> demo.
//
// This is original, openly-licensed demo data — neutral, everyday topics
// chosen to exercise every feature of the picker (grouping, hierarchy,
// notation badges, alt/hidden labels, definitions, multi-select, catch-all
// de-emphasis). In production you replace this with your own `data-source`
// endpoint (see README §3); these tables exist only so the demo runs
// standalone.
//
// IRIs use the reserved-for-documentation domain example.org.

const NS = 'https://example.org/vocab';

export const skosSchemes = [
  {
    id: 'Programming-Language',
    label: 'Programming Language',
    uri: `${NS}/Programming-Language`,
    description: 'A selection of widely-used programming languages.',
    concepts: [
      { id: 'JavaScript', uri: `${NS}/Programming-Language/JavaScript`, label: 'JavaScript' },
      { id: 'TypeScript', uri: `${NS}/Programming-Language/TypeScript`, label: 'TypeScript' },
      { id: 'Python', uri: `${NS}/Programming-Language/Python`, label: 'Python' },
      { id: 'Rust', uri: `${NS}/Programming-Language/Rust`, label: 'Rust' },
      { id: 'Go', uri: `${NS}/Programming-Language/Go`, label: 'Go' },
      { id: 'Java', uri: `${NS}/Programming-Language/Java`, label: 'Java' },
      { id: 'CSharp', uri: `${NS}/Programming-Language/CSharp`, label: 'C#' },
      { id: 'Haskell', uri: `${NS}/Programming-Language/Haskell`, label: 'Haskell' },
      { id: 'Other', uri: `${NS}/Programming-Language/Other`, label: 'Other' },
    ],
  },
  {
    id: 'Cuisine',
    label: 'Cuisine',
    uri: `${NS}/Cuisine`,
    description: 'Culinary traditions, grouped by region.',
    concepts: [
      { id: 'Italian', uri: `${NS}/Cuisine/Italian`, label: 'Italian' },
      { id: 'French', uri: `${NS}/Cuisine/French`, label: 'French' },
      { id: 'Spanish', uri: `${NS}/Cuisine/Spanish`, label: 'Spanish' },
      { id: 'Japanese', uri: `${NS}/Cuisine/Japanese`, label: 'Japanese' },
      { id: 'Thai', uri: `${NS}/Cuisine/Thai`, label: 'Thai' },
      { id: 'Indian', uri: `${NS}/Cuisine/Indian`, label: 'Indian' },
      { id: 'Mexican', uri: `${NS}/Cuisine/Mexican`, label: 'Mexican' },
      { id: 'Ethiopian', uri: `${NS}/Cuisine/Ethiopian`, label: 'Ethiopian' },
      { id: 'Fusion', uri: `${NS}/Cuisine/Fusion`, label: 'Fusion' },
    ],
  },
  {
    id: 'Music-Genre',
    label: 'Music Genre',
    uri: `${NS}/Music-Genre`,
    description: 'Popular music genres, grouped by family.',
    concepts: [
      { id: 'Jazz', uri: `${NS}/Music-Genre/Jazz`, label: 'Jazz' },
      { id: 'Bebop', uri: `${NS}/Music-Genre/Bebop`, label: 'Bebop' },
      { id: 'House', uri: `${NS}/Music-Genre/House`, label: 'House' },
      { id: 'Techno', uri: `${NS}/Music-Genre/Techno`, label: 'Techno' },
      { id: 'Rock', uri: `${NS}/Music-Genre/Rock`, label: 'Rock' },
      { id: 'Punk', uri: `${NS}/Music-Genre/Punk`, label: 'Punk' },
      { id: 'HipHop', uri: `${NS}/Music-Genre/HipHop`, label: 'Hip-Hop' },
      { id: 'Classical', uri: `${NS}/Music-Genre/Classical`, label: 'Classical' },
    ],
  },
  {
    id: 'Roast-Level',
    label: 'Coffee Roast Level',
    uri: `${NS}/Roast-Level`,
    description: 'Coffee roast levels, from lightest to darkest.',
    concepts: [
      { id: 'Light', uri: `${NS}/Roast-Level/Light`, label: 'Light' },
      { id: 'Medium-Light', uri: `${NS}/Roast-Level/Medium-Light`, label: 'Medium-Light' },
      { id: 'Medium', uri: `${NS}/Roast-Level/Medium`, label: 'Medium' },
      { id: 'Medium-Dark', uri: `${NS}/Roast-Level/Medium-Dark`, label: 'Medium-Dark' },
      { id: 'Dark', uri: `${NS}/Roast-Level/Dark`, label: 'Dark' },
    ],
  },
];

export const schemesById = Object.fromEntries(skosSchemes.map((s) => [s.id, s]));
