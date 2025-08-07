
import React, { useState, useEffect } from "react";
import { ScheduledTest } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, RefreshCw, Loader } from "lucide-react";

import TestSchedulingTable from "../components/test-scheduling/TestSchedulingTable";
import TestSchedulingForm from "../components/test-scheduling/TestSchedulingForm";

export default function TestScheduling() {
  const [scheduledTests, setScheduledTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [runningTests, setRunningTests] = useState([]);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const data = await ScheduledTest.list("-created_date");
      console.log('Loaded scheduled tests:', data);
      console.log('First test data:', data[0]);
      console.log('First test last_run_status:', data[0]?.last_run_status);
      setScheduledTests(data);
    } catch (error) {
      console.error("Error loading scheduled tests:", error);
    }
    setIsLoading(false);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingTest) {
        // Update
        const { id, ...updateData } = formData;
        await ScheduledTest.update(id, updateData);
      } else {
        // Create
        await ScheduledTest.create(formData);
      }
      setIsFormOpen(false);
      setEditingTest(null);
      await loadTests();
    } catch (error) {
      console.error("Failed to save test configuration:", error);
    }
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setIsFormOpen(true);
  };

  const handleDelete = async (testId) => {
    if (window.confirm("Are you sure you want to delete this configuration?")) {
      try {
        await ScheduledTest.delete(testId);
        await loadTests();
      } catch (error) {
        console.error("Failed to delete test configuration:", error);
      }
    }
  };

  const handleToggleActive = async (test, isActive) => {
    try {
      await ScheduledTest.update(test.id, { is_active: isActive });
      await loadTests();
    } catch (error) {
      console.error("Failed to update active status:", error);
    }
  };

  const handleRunNow = async (testId) => {
    setRunningTests(prev => [...prev, testId]);
    
    try {
      console.log(`Triggering workflow for test ID: ${testId}`);
      
      // Call the actual workflow trigger API
      const result = await ScheduledTest.runNow(testId);
      console.log('Workflow trigger result:', result);
      console.log('Result type:', typeof result);
      console.log('Result keys:', Object.keys(result || {}));
      
      // Reload the tests to get updated status
      await loadTests();
      
      // Start polling for status updates if workflow was triggered
      if (result.workflowRunId) {
        pollWorkflowStatus(testId);
      }
      
      // Remove from running tests after a short delay
      setTimeout(() => {
        setRunningTests(prev => prev.filter(id => id !== testId));
      }, 2000);
      
    } catch (error) {
      console.error("Failed to trigger workflow:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      // Remove from running tests on error
      setRunningTests(prev => prev.filter(id => id !== testId));
      
      // Reload tests to get any error status updates
      await loadTests();
    }
  };

  const pollWorkflowStatus = async (testId) => {
    const maxAttempts = 30; // Poll for up to 5 minutes (30 * 10 seconds)
    let attempts = 0;
    
    const poll = async () => {
      try {
        const statusResult = await ScheduledTest.checkStatus(testId);
        console.log(`Status check for test ${testId}:`, statusResult);
        
        // Reload tests to update the UI
        await loadTests();
        
        // If workflow is still running, continue polling
        if (statusResult.status === 'queued' || statusResult.status === 'in_progress') {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 10000); // Poll every 10 seconds
          }
        }
      } catch (error) {
        console.error(`Error polling status for test ${testId}:`, error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        }
      }
    };
    
    // Start polling after 5 seconds
    setTimeout(poll, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-emerald-800 bg-clip-text text-transparent">
              Test Scheduling
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Manage on-demand and scheduled test runs for your workflows.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadTests}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
            </Button>
            <Button onClick={() => setIsFormOpen(true)} className="bg-gradient-to-r from-blue-600 to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
              Test Configurations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-slate-500">
                <Loader className="w-8 h-8 mx-auto mb-4 animate-spin" />
                <p>Loading configurations...</p>
              </div>
            ) : (
              <TestSchedulingTable
                tests={scheduledTests}
                onRunNow={handleRunNow}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                runningTests={runningTests}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <TestSchedulingForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTest(null);
        }}
        onSubmit={handleFormSubmit}
        testToEdit={editingTest}
      />
    </div>
  );
}
