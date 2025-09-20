import React, { useState } from 'react';
import './searchbar.css'
const SearchBar = ({ onSearch } : any) => {
  const [query, setQuery] = useState('');

  const handleChange = (e:any) => {
    setQuery(e.target.value);
    onSearch(e.target.value); // Pass the current query to the parent component
  };

  return (
    <input
      type="text"
      placeholder="Search..."
      value={query}
      className='searchbar'
      onChange={handleChange}
    />
  );
};

export default SearchBar;