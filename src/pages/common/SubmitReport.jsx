import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Tooltip, Typography } from 'antd';
import { ReloadOutlined, SendOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';
import Sidebar from '../../components/core/Sidebar';
import { SecureStorage } from '../../utils/encryption';
import { toast } from 'sonner';

const { Text } = Typography;
const { TextArea } = Input;

const SubmitReport = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  const baseUrl = SecureStorage.getLocalItem('url');

  const initialName = useMemo(() => {
    const n = SecureStorage.getLocalItem('name');
    return (n && String(n).trim()) ? String(n).trim() : '';
  }, []);

  const [name, setName] = useState(initialName);
  const [issue, setIssue] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const resetForm = useCallback(() => {
    setIssue('');
    setDescription('');
  }, []);

  const handleSubmit = useCallback(async () => {
    const n = String(name || '').trim();
    const i = String(issue || '').trim();
    const d = String(description || '').trim();

    if (!baseUrl) {
      toast.error('Missing server URL. Please login again.');
      return;
    }

    if (!n || !i) {
      toast.error('Name and issue are required.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${baseUrl}faculty&staff.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'submitReport',
          name: n,
          issue: i,
          description: d ? d : null
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success(data.message || 'Report submitted successfully');
        resetForm();
      } else {
        toast.error(data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      if (!navigator.onLine || error?.message === 'Failed to fetch' || error?.name === 'TypeError') {
        toast.error('Network connection lost. Cannot reach the server.');
      } else {
        toast.error('Failed to submit report.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [baseUrl, name, issue, description, resetForm]);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className={`${isMobile ? 'px-4 py-4 mt-13' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-3xl mx-auto'} min-h-screen`}>
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${isMobile ? 'mb-3' : 'mb-4'}`}
          >
            <div className="mb-2 sm:mb-4">
              <h2 className="text-2xl font-bold text-green-900 mt-5">Submit Report</h2>
              <p className="text-sm text-gray-600 mt-1">Report issues or bugs so the team can review and fix them.</p>
            </div>
          </motion.div>

          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm`}>
            <Card bordered={false} className="bg-transparent" bodyStyle={{ padding: 0 }}>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Text type="secondary">Name</Text>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    size={isMobile ? 'middle' : 'large'}
                    allowClear
                  />
                </div>

                <div>
                  <Text type="secondary">Issue</Text>
                  <Input
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder="Short title (e.g., Calendar not loading)"
                    size={isMobile ? 'middle' : 'large'}
                    allowClear
                  />
                </div>

                <div>
                  <Text type="secondary">Description (optional)</Text>
                  <TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Steps to reproduce, expected behavior, screenshots info, etc."
                    autoSize={{ minRows: 5, maxRows: 10 }}
                  />
                </div>

                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'} mt-2`}>
                  <div className="flex items-center gap-2">
                    <Tooltip title="Clear form">
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={resetForm}
                        disabled={submitting}
                      />
                    </Tooltip>
                    <Text type="secondary" className="text-xs">
                      Required: Name, Issue
                    </Text>
                  </div>

                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSubmit}
                    loading={submitting}
                    className="bg-green-600 hover:bg-green-700"
                    size={isMobile ? 'middle' : 'large'}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitReport;
