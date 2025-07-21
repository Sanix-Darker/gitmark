import { h } from 'preact';
import { useState } from 'preact/hooks';

export function SearchBar({ onSearch, placeholder = "Search bookmarks..." }) {
  const [query, setQuery] = useState('');
  
  const handleInput = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };
  
  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };
  
  return h('div', { className: 'search-bar' }, [
    h('div', { className: 'search-input-container' }, [
      h('svg', {
        className: 'search-icon',
        width: 16,
        height: 16,
        viewBox: '0 0 16 16'
      }, [
        h('path', {
          d: 'M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'
        })
      ]),
      h('input', {
        type: 'text',
        className: 'search-input',
        placeholder,
        value: query,
        onInput: handleInput
      }),
      query && h('button', {
        className: 'clear-search',
        onClick: clearSearch,
        title: 'Clear search'
      }, '✕')
    ])
  ]);
}