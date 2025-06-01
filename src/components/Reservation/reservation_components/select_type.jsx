import React from 'react';
import { Card, Typography } from 'antd';
import { motion } from 'framer-motion';
import { BankOutlined, CarOutlined } from '@ant-design/icons';
import { FaTools } from 'react-icons/fa';
import { Tag } from 'primereact/tag';
import { FaCheckCircle } from 'react-icons/fa';

const { Title } = Typography;

const fadeInAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.5, ease: "easeOut" }
};

const resourceTypes = [
  { 
    value: 'venue', 
    title: 'Venue', 
    icon: <BankOutlined className="text-3xl sm:text-4xl mb-2 sm:mb-3" />,
    description: 'Conference rooms, halls, or other spaces for events and meetings',
    color: '#1890ff',
    gradient: 'from-blue-50 to-blue-100'
  },
  { 
    value: 'vehicle', 
    title: 'Vehicle', 
    icon: <CarOutlined className="text-3xl sm:text-4xl mb-2 sm:mb-3" />,
    description: 'Cars, vans, or other transportation for official travel',
    color: '#722ed1',
    gradient: 'from-purple-50 to-purple-100'
  },
  { 
    value: 'equipment', 
    title: 'Equipment', 
    icon: <FaTools className="text-3xl sm:text-4xl mb-2 sm:mb-3" />,
    description: 'Projectors, laptops, audio systems, and other equipment',
    color: '#13c2c2',
    gradient: 'from-cyan-50 to-cyan-100'
  }
];

const SelectType = ({ resourceType, onResourceTypeSelect }) => {
  return (
    <motion.div
      {...fadeInAnimation}
      className="py-4"
    >
      <Card className="shadow-lg rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
        <div className="text-center mb-8">
          <Title level={4} className="mb-3 text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            What would you like to reserve?
          </Title>
          <p className="text-gray-500 text-sm sm:text-base">Select the type of resource you need for your reservation</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {resourceTypes.map(option => (
            <motion.div
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`
                  h-full transition-all duration-300 cursor-pointer
                  hover:shadow-xl rounded-xl overflow-hidden
                  ${resourceType === option.value 
                    ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg bg-gradient-to-br ' + option.gradient
                    : 'border border-gray-100 hover:border-blue-200 bg-white'}
                `}
                onClick={() => onResourceTypeSelect(option.value)}
                bodyStyle={{ padding: '1.5rem' }}
              >
                <div 
                  className="flex flex-col items-center justify-center h-full"
                  style={{ 
                    color: resourceType === option.value ? option.color : 'inherit',
                  }}
                >
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center mb-4
                    ${resourceType === option.value 
                      ? 'bg-white/60 backdrop-blur-sm'
                      : 'bg-gray-50'}
                  `}>
                    {option.icon}
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{option.title}</h3>
                  <p className="text-gray-500 text-sm text-center leading-relaxed">
                    {option.description}
                  </p>
                  
                  {resourceType === option.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Tag severity="info" className="mt-4 px-3 py-2 rounded-full">
                        <div className="flex items-center gap-2">
                          <FaCheckCircle className="text-blue-500" />
                          <span className="font-medium">Selected</span>
                        </div>
                      </Tag>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm italic">Your selection will determine the next steps in the reservation process</p>
        </div>
      </Card>
    </motion.div>
  );
};

export default SelectType;
