-- Migration: 002_add_workflow_run_id.sql
-- Add workflow run ID to test results for better tracking

ALTER TABLE test_results 
ADD COLUMN workflow_run_id BIGINT;

CREATE INDEX idx_test_results_workflow_run_id ON test_results(workflow_run_id);
