import React from 'react';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

export const GuidelineTooltip = ({ title, content }) => (
  <Tooltip
    title={
      <div className="p-1">
        <h4 className="font-medium mb-1">{title}</h4>
        <p className="text-xs">{content}</p>
      </div>
    }
    color="#fff"
    overlayInnerStyle={{ 
      color: '#555', 
      boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
      border: '1px solid #eee'
    }}
  >
    <QuestionCircleOutlined className="ml-1 text-gray-400 cursor-help" />
  </Tooltip>
); 