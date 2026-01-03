import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, Empty, Input, Pagination, Tooltip, Typography } from 'antd';
import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/core/Sidebar';
import { SecureStorage } from '../../utils/encryption';
import JobOrderDetailsModal from '../../components/core/JobOrderDetailsModal';

const { Text } = Typography;

const getStatusStyle = (status) => {
  const normalizedStatus = String(status || '').toLowerCase();

  switch (normalizedStatus) {
    case 'pending':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200'
      };
    case 'ongoing':
    case 'on-going':
    case 'in progress':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200'
      };
    case 'complete':
    case 'completed':
    case 'done':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200'
      };
    case 'declined':
    case 'decline':
    case 'cancelled':
    case 'cancel':
    case 'rejected':
    case 'reject':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200'
      };
  }
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const MyTicketRequest = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  const baseUrl = SecureStorage.getLocalItem('url');
  const userId = SecureStorage.getLocalItem('user_id');

  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getLocalItem('user_level_id');
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    if (decryptedUserLevel !== 5 && decryptedUserLevel !== 6 && decryptedUserLevel !== 18 && decryptedUserLevel !== 20) {
      localStorage.clear();
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const storedUserId = SecureStorage.getLocalItem('user_id');
    const isLoggedIn = localStorage.getItem('loggedIn');
    if (!storedUserId || !isLoggedIn) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (isMobile) setPageSize(5);
    else if (isTablet) setPageSize(8);
    else setPageSize(10);
  }, [isMobile, isTablet]);

  const fetchTickets = useCallback(async () => {
    if (!baseUrl || !userId) return;
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}faculty&staff.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'getTicketsByClientId',
          userId: userId
        })
      });

      const result = await response.json();

      if (result?.status === 'success' && Array.isArray(result.data)) {
        setTickets(result.data);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, userId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase();
    if (!q) return tickets;

    return tickets.filter((t) => {
      const id = String(t.comp_id ?? '').toLowerCase();
      const subject = String(t.comp_subject ?? '').toLowerCase();
      const status = String(t.comp_status ?? '').toLowerCase();
      return id.includes(q) || subject.includes(q) || status.includes(q);
    });
  }, [tickets, searchTerm]);

  const pagedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handleRefresh = () => {
    fetchTickets();
    setSearchTerm('');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className={`${isMobile ? 'px-4 py-4 mt-5' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${isMobile ? 'mb-3' : 'mb-4'}`}
          >
            <div className="mb-2 sm:mb-4 mt-10">
              <h2 className="text-2xl font-bold text-green-900 mt-5">
                My Ticket Request
              </h2>
            </div>
          </motion.div>

          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-6'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
              <div className="flex-grow">
                <Input
                  placeholder={isMobile ? 'Search tickets...' : 'Search by Ticket ID, Subject, or Status'}
                  allowClear
                  prefix={<SearchOutlined />}
                  size={isMobile ? 'middle' : 'large'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className={`flex gap-2 ${isMobile ? 'justify-center' : ''}`}>
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    size={isMobile ? 'middle' : 'large'}
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loader"></div>
              </div>
            ) : (
              <>
                {isMobile ? (
                  <div className="p-3">
                    {pagedTickets && pagedTickets.length > 0 ? (
                      pagedTickets.map((ticket) => {
                        const statusStyle = getStatusStyle(ticket.comp_status);
                        return (
                          <Card key={ticket.comp_id} className="mb-3 shadow-sm" size="small">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center min-w-0">
                                  <EyeOutlined className="mr-2 text-green-900 flex-shrink-0" />
                                  <Text strong className="text-sm truncate">#{ticket.comp_id} - {ticket.comp_subject}</Text>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button
                                    icon={<EyeOutlined />}
                                    onClick={() => {
                                      setSelectedTicket(ticket);
                                      setIsModalOpen(true);
                                    }}
                                    size="small"
                                    type="primary"
                                    className="bg-green-600 hover:bg-green-700 border-green-600"
                                  />
                                </div>
                              </div>

                              <div>
                                <Text type="secondary" className="text-xs">Created:</Text>
                                <div className="text-xs text-gray-600">{formatDateTime(ticket.comp_date)}</div>
                              </div>

                              <div>
                                <Text type="secondary" className="text-xs">Expected End Date:</Text>
                                <div className="text-xs text-gray-600">{formatDateTime(ticket.comp_end_date)}</div>
                              </div>

                              <div className="flex justify-end items-center">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                  {ticket.comp_status || 'Unknown'}
                                </span>
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={<span className="text-gray-500">No tickets found</span>}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700 bg-white rounded-t-2xl overflow-hidden">
                      <thead className="bg-green-100 text-gray-800 font-bold rounded-t-2xl">
                        <tr>
                          <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>TICKET ID</th>
                          <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>SUBJECT</th>
                          <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>STATUS</th>
                          {!isTablet && (
                            <th scope="col" className="px-4 py-4">OPERATION</th>
                          )}
                          {!isTablet && (
                            <th scope="col" className="px-4 py-4">DATE CREATED</th>
                          )}
                          <th scope="col" className={`${isTablet ? 'px-3 py-3' : 'px-4 py-4'}`}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedTickets && pagedTickets.length > 0 ? (
                          pagedTickets.map((ticket) => {
                            const statusStyle = getStatusStyle(ticket.comp_status);
                            return (
                              <tr key={ticket.comp_id} className="bg-white border-b last:border-b-0 border-gray-200">
                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-5'} font-semibold`}>#{ticket.comp_id}</td>
                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-5'} font-semibold`}>
                                  <span className="truncate block max-w-[260px]">{ticket.comp_subject}</span>
                                </td>
                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-5'}`}>
                                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                    {ticket.comp_status || 'Unknown'}
                                  </span>
                                </td>
                                {!isTablet && (
                                  <td className="px-4 py-5 whitespace-nowrap">{ticket.operation_name || '-'}</td>
                                )}
                                {!isTablet && (
                                  <td className="px-4 py-5 whitespace-nowrap">{formatDateTime(ticket.comp_date)}</td>
                                )}
                                <td className={`${isTablet ? 'px-3 py-3' : 'px-4 py-5'}`}>
                                  <div className="flex justify-center">
                                    <Tooltip title="View Details">
                                      <Button
                                        shape="circle"
                                        icon={<EyeOutlined />}
                                        onClick={() => {
                                          setSelectedTicket(ticket);
                                          setIsModalOpen(true);
                                        }}
                                        size={isTablet ? 'middle' : 'large'}
                                        className="bg-green-900 hover:bg-lime-900 text-white shadow-lg flex items-center justify-center"
                                      />
                                    </Tooltip>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={isTablet ? 4 : 6} className="px-2 py-12 sm:px-6 sm:py-24 text-center">
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={<span className="text-gray-500 dark:text-gray-400">No tickets found</span>}
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredTickets ? filteredTickets.length : 0}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }}
                    showSizeChanger={!isMobile}
                    showTotal={!isMobile ? (total, range) => `${range[0]}-${range[1]} of ${total} items` : false}
                    size={isMobile ? 'small' : 'default'}
                    className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}
                    simple={isMobile}
                  />
                </div>
              </>
            )}
          </div>

          <JobOrderDetailsModal
            open={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedTicket(null);
            }}
            ticket={selectedTicket}
            baseUrl={baseUrl}
          />
        </div>
      </div>
    </div>
  );
};

export default MyTicketRequest;
