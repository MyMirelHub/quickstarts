using Dapr.Workflow;
using Monitor.Activities;

namespace Monitor;

internal sealed class MonitorWorkflow : Workflow<int, string>
{
    public override async Task<string> RunAsync(WorkflowContext context, int counter)
    {
        var status = await context.CallActivityAsync<Status>(
            nameof(CheckStatus),
            counter);

        if (!status.IsReady)
        {
            // Start a child workflow WITHOUT awaiting it
            var childWorkflowTask = context.CallChildWorkflowAsync<string>(
                nameof(ChildWorkflow),
                counter);
            
            await context.CreateTimer(TimeSpan.FromSeconds(1));
            counter++;
            
            // ContinueAsNew should proceed immediately without waiting for child workflow
            context.ContinueAsNew(counter);
        }

        return $"Status is healthy after checking {counter} times.";
    }
}
