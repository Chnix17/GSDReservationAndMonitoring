import React from 'react';
import { Typography } from 'antd';
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
    color: '#548e54',
    gradient: 'from-lightcream to-accent-light'
  },
  { 
    value: 'vehicle', 
    title: 'Vehicle', 
    icon: <CarOutlined className="text-3xl sm:text-4xl mb-2 sm:mb-3" />,
    description: 'Cars, vans, or other transportation for official travel',
    color: '#548e54',
    gradient: 'from-lightcream to-accent-light'
  },
  { 
    value: 'equipment', 
    title: 'Equipment', 
    icon: <FaTools className="text-3xl sm:text-4xl mb-2 sm:mb-3" />,
    description: 'Projectors, laptops, audio systems, and other equipment',
    color: '#548e54',
    gradient: 'from-lightcream to-accent-light'
  }
];

const SelectType = ({ resourceType, onResourceTypeSelect, onStepAdvance }) => {
  const handleResourceTypeSelect = (type) => {
    onResourceTypeSelect(type);
    // Immediately advance to next step
    onStepAdvance();
  };

  return (
    <motion.div
      {...fadeInAnimation}
      className="py-4"
    >
      <div className="text-center mb-8">
        <Title level={4} className="mb-3 text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
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
            <div
              className={`
                h-full transition-all duration-300 cursor-pointer
                hover:shadow-xl rounded-xl overflow-hidden p-6 border
                ${resourceType === option.value 
                  ? 'ring-2 ring-offset-2 ring-primary shadow-lg bg-gradient-to-br ' + option.gradient
                  : 'border-gray-100 hover:border-primary-light bg-white'}
              `}
              onClick={() => handleResourceTypeSelect(option.value)}
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
                    <Tag severity="success" className="mt-4 px-3 py-2 rounded-full">
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-primary" />
                        <span className="font-medium">Selected</span>
                      </div>
                    </Tag>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm italic">Your selection will determine the next steps in the reservation process</p>
      </div>
    </motion.div>
  );
};

export default SelectType;
