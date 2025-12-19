using Dapr.Workflow;

namespace Monitor;

/// <summary>
/// A simple child workflow that takes some time to complete.
/// This is used to test if ContinueAsNew waits for child workflows.
/// </summary>
internal sealed class ChildWorkflow : Workflow<int, string>
{
    public override async Task<string> RunAsync(WorkflowContext context, int input)
    {
        Console.WriteLine($"[ChildWorkflow] Started with input: {input}");
        
        // Simulate some work that takes time - this makes the bug visible
        await context.CreateTimer(TimeSpan.FromSeconds(5));
        
        Console.WriteLine($"[ChildWorkflow] Completed with input: {input}");
        return $"Child workflow completed for input: {input}";
    }
}

