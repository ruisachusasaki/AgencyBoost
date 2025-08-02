import MetricsCards from "@/components/dashboard/metrics-cards";
import RecentClients from "@/components/dashboard/recent-clients";
import TasksOverview from "@/components/dashboard/tasks-overview";
import ActiveCampaigns from "@/components/dashboard/active-campaigns";
import LeadsPipeline from "@/components/dashboard/leads-pipeline";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <MetricsCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentClients />
        <TasksOverview />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActiveCampaigns />
        </div>
        <LeadsPipeline />
      </div>
    </div>
  );
}
