import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useContractContext } from '../shared/ContractContext';

const ListHeader: React.FC = () => {
  const { filters, setFilters } = useContractContext();
  const [searchInput, setSearchInput] = useState(filters.search);

  // Update local state when filters change
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by therapist or client name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
        />
      </div>
    </div>
  );
};

export default ListHeader;
