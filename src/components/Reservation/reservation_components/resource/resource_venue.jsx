import React, { useState, useEffect, useRef } from 'react';
import { Card, Empty, Tag, Spin, Input, Pagination } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { BsBuilding } from 'react-icons/bs';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { SecureStorage } from '../../../../utils/encryption';

const VenueCard = React.forwardRef(({ venue, isSelected, onClick, isMobile }, ref) => {
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`${isMobile ? 'mx-1' : 'mx-2'}`} // Added horizontal margin to prevent clipping
    >
      <Card
        className={`
          overflow-hidden border border-gray-50/20 hover:border-gray-100 
          shadow-sm hover:shadow-md transition-all
          ${isSelected ? 'ring-2 ring-green-500 bg-green-50/30' : 'bg-white/80 hover:bg-gray-50/50'}
          flex
          ${isMobile ? 'py-1 px-2' : 'p-2'}
          backdrop-blur-sm
          h-[100px]
        `}
        onClick={onClick}
        bodyStyle={{ padding: 0 }}
      >
        <div className={`
          flex flex-row items-center
          ${isMobile ? 'gap-1' : 'gap-2'} w-full h-full
        `}>
          <div className={`
            flex items-center justify-center rounded-lg bg-gradient-to-br from-green-100/80 to-green-50/80
            ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}
            flex-shrink-0
            border border-gray-100/30
          `}>
            <BsBuilding className={`text-green-500 ${isMobile ? 'text-sm' : 'text-lg'}`} />
          </div>

          <div className="flex-1 min-w-0 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between gap-1 mb-0">
              <h3 className={`
                font-medium text-gray-800 truncate
                ${isMobile ? 'text-xs' : 'text-sm'}
              `}>
                {venue.ven_name}
              </h3>
              {isSelected && (
                <Tag 
                  color="green"
                  className={`
                    flex items-center font-medium whitespace-nowrap
                    ${isMobile ? 'text-[8px] px-1 py-0' : 'text-xs px-1 py-0'}
                    bg-green-100/80 border border-green-200/50
                  `}
                >
                  Selected
                </Tag>
              )}
            </div>
            {venue.ven_occupancy && (
              <p className={`
                text-gray-500 mt-0
                ${isMobile ? 'text-[10px]' : 'text-xs'}
              `}>
                Capacity: {venue.ven_occupancy}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

const ResourceVenue = ({ selectedVenues, onVenueSelect, isMobile }) => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const firstVenueRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const filteredVenues = venues.filter(venue =>
    venue.ven_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (venue.ven_occupancy?.toString() || '').includes(searchQuery)
  );

  const totalItems = filteredVenues.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVenues = filteredVenues.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setTimeout(() => {
      if (isMobile && firstVenueRef.current) {
        firstVenueRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const encryptedUrl = SecureStorage.getLocalItem("url");
      if (!encryptedUrl) {
        toast.error("API URL configuration is missing");
        return;
      }

      const response = await axios({
        method: 'post',
        url: `${encryptedUrl}fetch2.php`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          operation: 'fetchVenue'
        }
      });

      if (response.data.status === 'success') {
        setVenues(response.data.data);
      } else {
        toast.error("Error fetching venues: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
      toast.error("An error occurred while fetching venues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col h-full ${isMobile ? 'p-1' : 'p-3'}`}
    >
      {/* Fixed Header Section */}
      <div className={`
        flex flex-col gap-3
        bg-white/80 backdrop-blur-sm rounded-lg shadow-sm
        ${isMobile ? 'p-3 mb-2' : 'p-4 mb-3'}
        sticky top-0 z-10
        border border-gray-100/20
      `}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1">
            <h2 className={`
              font-semibold text-gray-900
              ${isMobile ? 'text-base' : 'text-lg'}
            `}>
              {selectedVenues.length > 0
                ? `Selected Venues (${selectedVenues.length})`
                : 'Available Venues'}
            </h2>
            <p className={`
              text-gray-600 mt-0.5
              ${isMobile ? 'text-xs' : 'text-sm'}
            `}>
              {selectedVenues.length > 0
                ? 'Click to deselect venues'
                : 'Select venues to proceed'}
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className={`${isMobile ? 'mt-1' : 'mt-2'}`}>
          <Input
            placeholder="Search venues by name or capacity..."
            prefix={<SearchOutlined className="text-gray-400" />}
            onChange={(e) => handleSearch(e.target.value)}
            value={searchQuery}
            className="w-full"
            size={isMobile ? 'middle' : 'large'}
            bordered
            allowClear
          />
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-1" // Added horizontal padding
        style={{ 
          maxHeight: 'calc(100vh - 180px)',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spin size={isMobile ? "default" : "large"} />
          </div>
        ) : (
          <AnimatePresence>
            <div className={`flex flex-col ${isMobile ? 'gap-1.5' : 'gap-2.5'}`}>
              {currentVenues.map((venue, idx) => (
                <VenueCard
                  key={venue.ven_id}
                  venue={venue}
                  isSelected={selectedVenues.includes(venue.ven_id)}
                  onClick={() => onVenueSelect(venue.ven_id)}
                  isMobile={isMobile}
                  ref={idx === 0 ? firstVenueRef : undefined}
                />
              ))}
            </div>

            {filteredVenues.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center h-full"
              >
                <Empty
                  description={
                    <div className="text-center">
                      <h3 className={`
                        font-medium text-gray-800 mb-1
                        ${isMobile ? 'text-sm' : 'text-base'}
                      `}>
                        {searchQuery 
                          ? 'No venues match your search'
                          : 'No Venues Available'}
                      </h3>
                      <p className={`
                        text-gray-500
                        ${isMobile ? 'text-xs' : 'text-sm'}
                      `}>
                        {searchQuery 
                          ? 'Try different keywords or clear the search'
                          : 'Check back later for available venues'}
                      </p>
                    </div>
                  }
                  className={`bg-white/80 backdrop-blur-sm rounded-lg shadow-sm ${isMobile ? 'p-4' : 'p-6'} border border-gray-100/20`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Fixed Pagination Section */}
      {filteredVenues.length > 0 && (
        <div className={`
          bg-white/80 backdrop-blur-sm rounded-lg shadow-sm
          ${isMobile ? 'p-2 mt-1' : 'p-3 mt-2'}
          sticky bottom-0 z-10
          border border-gray-100/20
        `}>
          <Pagination
            current={currentPage}
            total={totalItems}
            pageSize={itemsPerPage}
            onChange={handlePageChange}
            size={isMobile ? "small" : "default"}
            showSizeChanger={false}
            showQuickJumper={!isMobile}
            className="flex justify-center"
            responsive
            simple={isMobile}
          />
        </div>
      )}
    </motion.div>
  );
};

export default ResourceVenue;