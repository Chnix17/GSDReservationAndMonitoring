import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle, Wrench, Eye, Play, Pause     } from 'lucide-react';
import Sidebar from './component/sidebar';
import {SecureStorage} from '../../utils/encryption';
const MaintenanceDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaintenanceTasks = async () => {
      try {
        const response = await fetch('http://localhost/coc/gsd/personnel.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: "fetchAssignedMaintenance",
            personnel_id: SecureStorage.getSessionItem("user_id")
          })
        });
        
        const result = await response.json();
        if (result.status === "success") {
          setTasks(result.data.map(task => ({
            id: task.maintenance_id,
            type: task.resource_type,
            resourceName: task.resource_name,
            dueDate: task.due_date,
            status: getStatusFromId(task.maintenance_status_id),
            dateReported: task.date_reported,
            dateCompleted: task.date_completed,
            isActive: task.is_active === "1"
          })));
        }
      } catch (error) {
        console.error('Error fetching maintenance tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceTasks();
  }, []);

  const getStatusFromId = (statusId) => {
    // Map status IDs to status names - adjust these based on your actual status IDs
    const statusMap = {
      "1": "Pending",
      "2": "In Progress",
      "3": "Completed",
      "4": "Overdue"
    };
    return statusMap[statusId] || "Unknown";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Preventive': return <Calendar className="w-4 h-4" />;
      case 'Corrective': return <Wrench className="w-4 h-4" />;
      case 'Predictive': return <AlertCircle className="w-4 h-4" />;
      case 'Emergency': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      // Here you would make an API call to update the status
      // For now, we'll just update the local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Maintenance Dashboard</h1>
            <p className="text-gray-600">Monitor and manage maintenance tasks to keep resources operational</p>
          </div>

          {/* Tasks Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Maintenance Tasks</h2>
            </div>
            
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No maintenance tasks found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Reported</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTypeIcon(task.type)}
                            <span className="ml-2 text-sm font-medium text-gray-900 capitalize">{task.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{task.resourceName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{task.dueDate}</div>
                          <div className={`text-xs ${getDaysUntilDue(task.dueDate) < 0 ? 'text-red-500' : getDaysUntilDue(task.dueDate) <= 2 ? 'text-orange-500' : 'text-gray-500'}`}>
                            {getDaysUntilDue(task.dueDate) < 0 
                              ? `${Math.abs(getDaysUntilDue(task.dueDate))} days overdue`
                              : `${getDaysUntilDue(task.dueDate)} days remaining`
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{new Date(task.dateReported).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </button>
                            
                            {task.status === 'Pending' && (
                              <button
                                onClick={() => updateTaskStatus(task.id, 'In Progress')}
                                className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Start
                              </button>
                            )}
                            
                            {task.status === 'In Progress' && (
                              <>
                                <button
                                  onClick={() => updateTaskStatus(task.id, 'Completed')}
                                  className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Complete
                                </button>
                                <button
                                  onClick={() => updateTaskStatus(task.id, 'Pending')}
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                  <Pause className="w-3 h-3 mr-1" />
                                  Pause
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Task Detail Modal */}
          {selectedTask && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="px-6 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Resource Name</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedTask.resourceName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTask.type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedTask.status)}`}>
                        {selectedTask.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <div className="flex items-center mt-1">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(selectedTask.priority)} mr-2`}></div>
                        <span className="text-sm text-gray-900">{selectedTask.priority}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTask.dueDate}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estimated Time</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTask.estimatedTime}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTask.description}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTask.assignee}</p>
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      if (selectedTask.status === 'Pending') {
                        updateTaskStatus(selectedTask.id, 'In Progress');
                      } else if (selectedTask.status === 'In Progress') {
                        updateTaskStatus(selectedTask.id, 'Completed');
                      }
                      setSelectedTask(null);
                    }}
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {selectedTask.status === 'Pending' ? 'Start Task' : selectedTask.status === 'In Progress' ? 'Mark Complete' : 'Task Complete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;