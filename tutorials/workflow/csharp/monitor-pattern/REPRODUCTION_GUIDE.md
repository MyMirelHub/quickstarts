# Bug Reproduction Guide: ContinueAsNew Waiting for Child Workflows

## Quick Start

1. **Start Dapr:**
   ```bash
   cd tutorials/workflow/csharp/monitor-pattern
   dapr run -f .
   ```

2. **Start the workflow:**
   ```bash
   curl -i --request POST http://localhost:5257/start/0
   ```

3. **Verify the bug using Dapr CLI:**
   ```bash
   dapr workflow list --app-id monitor --connection-string=redis://127.0.0.1:6379 -o wide
   ```

## How to Identify the Bug

The `dapr workflow list` command shows timestamps that reveal the bug:

**Look for:**
- Child workflows complete sequentially with ~5 second gaps between them
- Parent workflow (MonitorWorkflow) completes only AFTER all child workflows finish
- Each child workflow takes exactly 5 seconds (CREATED to LAST UPDATE)

**Example from the output:**
```
ChildWorkflow  CREATED: 15:03:09  LAST UPDATE: 15:03:14  (5 seconds)
ChildWorkflow  CREATED: 15:03:14  LAST UPDATE: 15:03:19  (5 seconds)
ChildWorkflow  CREATED: 15:03:19  LAST UPDATE: 15:03:24  (5 seconds)
MonitorWorkflow CREATED: 15:03:24  LAST UPDATE: 15:03:24  (completes after children)
```

This sequential pattern with 5-second gaps proves that `ContinueAsNew` waits for child workflows to complete before starting the next round.

**Expected behavior (when fixed):** Child workflows would have overlapping timestamps, and the parent would complete much earlier.

