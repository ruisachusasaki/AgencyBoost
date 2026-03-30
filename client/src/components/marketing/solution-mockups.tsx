import { BrowserChrome, MockSidebar, StatusBadge, MetricCard, AvatarCircle, DataRow, KanbanColumn, ProgressBar, teal } from "./mockup-elements";

export function LeadsMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/leads">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Leads" items={["Dashboard", "Leads", "Clients", "Tasks", "Calendar"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">Lead Pipeline</div>
              <div className="text-[10px] text-gray-500">12 active leads &middot; $48,500 potential</div>
            </div>
            <div className="flex gap-2">
              <div className="px-2 py-1 rounded-md text-[10px] font-medium text-white" style={{ backgroundColor: teal }}>+ New Lead</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <MetricCard label="Total Leads" value="12" sub="+3 this week" />
            <MetricCard label="Pipeline Value" value="$48.5K" sub="+12% vs last month" />
            <MetricCard label="Avg. Close Rate" value="34%" />
            <MetricCard label="Hot Leads" value="5" sub="Need follow-up" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <KanbanColumn title="New" color="#3B82F6" cards={[
              { name: "Acme Corp", sub: "$12,000 &middot; SEO", badge: "Hot", badgeColor: "red" },
              { name: "Bloom Studio", sub: "$5,000 &middot; Social", badge: "Warm", badgeColor: "yellow" },
            ]} />
            <KanbanColumn title="Contacted" color={teal} cards={[
              { name: "Nexus Digital", sub: "$8,500 &middot; PPC", badge: "Responded", badgeColor: "green" },
            ]} />
            <KanbanColumn title="Proposal" color="#F59E0B" cards={[
              { name: "Peak Fitness", sub: "$15,000 &middot; Full Service", badge: "Sent", badgeColor: "blue" },
              { name: "Green Valley", sub: "$8,000 &middot; Web Design" },
            ]} />
            <KanbanColumn title="Won" color="#22C55E" cards={[
              { name: "Urban Eats", sub: "$10,000 &middot; Branding", badge: "Closed", badgeColor: "green" },
            ]} />
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function CRMMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/clients">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Clients" items={["Dashboard", "Leads", "Clients", "Tasks", "Reports"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">Client Management</div>
            <div className="px-2 py-1 rounded-md text-[10px] font-medium text-white" style={{ backgroundColor: teal }}>+ Add Client</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <MetricCard label="Active Clients" value="24" />
            <MetricCard label="Monthly Revenue" value="$87.2K" sub="+8% growth" />
            <MetricCard label="Avg. Health Score" value="8.4/10" sub="2 need attention" />
            <MetricCard label="Retention Rate" value="96%" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <DataRow header cells={["Client", "Status", "Health", "Monthly Budget", "Contact"]} />
            <DataRow cells={[
              <div className="flex items-center gap-1.5"><AvatarCircle initials="SFR" color="#6366F1" /><span className="font-medium">Six Figure Room</span></div>,
              <StatusBadge label="Active" color="green" />,
              <StatusBadge label="Green" color="green" />,
              "$8,500/mo",
              "joe@sixfigureroom.com"
            ]} />
            <DataRow cells={[
              <div className="flex items-center gap-1.5"><AvatarCircle initials="PE" color="#EC4899" /><span className="font-medium">Peak Events</span></div>,
              <StatusBadge label="Active" color="green" />,
              <StatusBadge label="Yellow" color="yellow" />,
              "$5,200/mo",
              "sarah@peakevents.com"
            ]} />
            <DataRow cells={[
              <div className="flex items-center gap-1.5"><AvatarCircle initials="AC" color="#F59E0B" /><span className="font-medium">Acme Corp</span></div>,
              <StatusBadge label="Active" color="green" />,
              <StatusBadge label="Green" color="green" />,
              "$12,000/mo",
              "mike@acmecorp.com"
            ]} />
            <DataRow cells={[
              <div className="flex items-center gap-1.5"><AvatarCircle initials="BS" color="#14B8A6" /><span className="font-medium">Bloom Studio</span></div>,
              <StatusBadge label="Onboarding" color="blue" />,
              <StatusBadge label="Green" color="green" />,
              "$3,800/mo",
              "lisa@bloomstudio.co"
            ]} />
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function TasksMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/tasks">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Tasks" items={["Dashboard", "Clients", "Tasks", "Calendar", "Reports"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">Task Board</div>
            <div className="flex gap-2">
              <div className="px-2 py-1 rounded-md text-[10px] bg-gray-100 text-gray-600">Board View</div>
              <div className="px-2 py-1 rounded-md text-[10px] text-white" style={{ backgroundColor: teal }}>+ New Task</div>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <KanbanColumn title="To Do" color="#94A3B8" cards={[
              { name: "Homepage Redesign", sub: "Acme Corp &middot; Due Mar 15", badge: "High", badgeColor: "red" },
              { name: "Blog Content Plan", sub: "Bloom Studio &middot; Due Mar 18" },
            ]} />
            <KanbanColumn title="In Progress" color={teal} cards={[
              { name: "Google Ads Setup", sub: "Peak Events &middot; Due Mar 12", badge: "Medium", badgeColor: "yellow" },
              { name: "Social Calendar", sub: "Urban Eats &middot; Due Mar 14", badge: "On Track", badgeColor: "green" },
              { name: "Email Sequences", sub: "Six Figure Room &middot; Due Mar 16" },
            ]} />
            <KanbanColumn title="In Review" color="#8B5CF6" cards={[
              { name: "Brand Guidelines", sub: "Green Valley &middot; Due Mar 10", badge: "Waiting", badgeColor: "blue" },
            ]} />
            <KanbanColumn title="Complete" color="#22C55E" cards={[
              { name: "SEO Audit Report", sub: "Nexus Digital &middot; Completed", badge: "Done", badgeColor: "green" },
            ]} />
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function CampaignsMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/campaigns">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Campaigns" items={["Dashboard", "Clients", "Campaigns", "Reports", "Calendar"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">Campaign Management</div>
            <div className="px-2 py-1 rounded-md text-[10px] text-white" style={{ backgroundColor: teal }}>+ New Campaign</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <MetricCard label="Active Campaigns" value="8" sub="3 launching this week" />
            <MetricCard label="Total Spend" value="$24.5K" sub="This month" />
            <MetricCard label="Avg. ROAS" value="4.2x" sub="+0.6 vs last month" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <DataRow header cells={["Campaign", "Client", "Status", "Budget", "Performance"]} />
            <DataRow cells={[
              <span className="font-medium">Spring Sale PPC</span>,
              "Acme Corp",
              <StatusBadge label="Running" color="green" />,
              "$4,200",
              <div className="flex items-center gap-1"><span className="text-green-600 text-[10px]">ROAS 5.1x</span></div>
            ]} />
            <DataRow cells={[
              <span className="font-medium">Brand Awareness</span>,
              "Peak Events",
              <StatusBadge label="Running" color="green" />,
              "$6,800",
              <div className="flex items-center gap-1"><span className="text-green-600 text-[10px]">ROAS 3.8x</span></div>
            ]} />
            <DataRow cells={[
              <span className="font-medium">Lead Gen FB</span>,
              "Bloom Studio",
              <StatusBadge label="Scheduled" color="blue" />,
              "$2,500",
              <span className="text-gray-400 text-[10px]">Pending</span>
            ]} />
            <DataRow cells={[
              <span className="font-medium">Retargeting Ads</span>,
              "Six Figure Room",
              <StatusBadge label="Running" color="green" />,
              "$3,100",
              <div className="flex items-center gap-1"><span className="text-green-600 text-[10px]">ROAS 6.2x</span></div>
            ]} />
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function CalendarMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/calendar">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Calendar" items={["Dashboard", "Clients", "Tasks", "Calendar", "Meetings"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">March 2026</div>
            <div className="flex gap-2 items-center">
              <div className="px-2 py-1 rounded-md text-[10px] bg-gray-100 text-gray-600">Week</div>
              <div className="px-2 py-1 rounded-md text-[10px] text-white" style={{ backgroundColor: teal }}>+ Schedule</div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map(d => (
              <div key={d} className="bg-gray-50 p-1.5 text-center text-[10px] font-medium text-gray-500">{d}</div>
            ))}
            <div className="bg-white p-1.5 min-h-[60px]">
              <div className="text-[10px] text-gray-400 mb-1">16</div>
              <div className="text-[9px] px-1 py-0.5 rounded text-white mb-0.5" style={{ backgroundColor: teal }}>9:00 Acme Call</div>
            </div>
            <div className="bg-white p-1.5 min-h-[60px]">
              <div className="text-[10px] text-gray-400 mb-1">17</div>
              <div className="text-[9px] px-1 py-0.5 rounded bg-blue-500 text-white mb-0.5">10:00 Team Sync</div>
              <div className="text-[9px] px-1 py-0.5 rounded bg-purple-500 text-white">2:00 Strategy</div>
            </div>
            <div className="bg-white p-1.5 min-h-[60px]">
              <div className="text-[10px] text-gray-400 mb-1">18</div>
              <div className="text-[9px] px-1 py-0.5 rounded bg-orange-500 text-white mb-0.5">11:00 Peak Demo</div>
            </div>
            <div className="bg-white p-1.5 min-h-[60px]">
              <div className="text-[10px] text-gray-400 mb-1">19</div>
              <div className="text-[9px] px-1 py-0.5 rounded text-white mb-0.5" style={{ backgroundColor: teal }}>1:00 Review</div>
              <div className="text-[9px] px-1 py-0.5 rounded bg-pink-500 text-white">3:30 Onboard</div>
            </div>
            <div className="bg-white p-1.5 min-h-[60px]">
              <div className="text-[10px] text-gray-400 mb-1">20</div>
              <div className="text-[9px] px-1 py-0.5 rounded bg-indigo-500 text-white mb-0.5">9:30 Bloom Call</div>
            </div>
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function ProposalsMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/sales/quotes">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Proposals" items={["Dashboard", "Leads", "Proposals", "Invoices", "Reports"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">Proposals & Quotes</div>
            <div className="px-2 py-1 rounded-md text-[10px] text-white" style={{ backgroundColor: teal }}>+ Create Proposal</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <MetricCard label="Open Proposals" value="6" sub="$72,500 pending" />
            <MetricCard label="Win Rate" value="68%" sub="+5% this quarter" />
            <MetricCard label="Avg. Deal Size" value="$8,200" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <DataRow header cells={["Proposal", "Client", "Value", "Status", "Sent"]} />
            <DataRow cells={[
              <span className="font-medium">Full Service Retainer</span>,
              "Peak Events",
              "$15,000/mo",
              <StatusBadge label="Viewed" color="blue" />,
              "Mar 12"
            ]} />
            <DataRow cells={[
              <span className="font-medium">SEO + Content Package</span>,
              "Acme Corp",
              "$8,500/mo",
              <StatusBadge label="Signed" color="green" />,
              "Mar 8"
            ]} />
            <DataRow cells={[
              <span className="font-medium">Social Media Mgmt</span>,
              "Bloom Studio",
              "$3,200/mo",
              <StatusBadge label="Draft" color="gray" />,
              "--"
            ]} />
            <DataRow cells={[
              <span className="font-medium">PPC Management</span>,
              "Green Valley",
              "$4,800/mo",
              <StatusBadge label="Sent" color="yellow" />,
              "Mar 14"
            ]} />
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function InvoicingMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/invoicing">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Invoicing" items={["Dashboard", "Clients", "Invoicing", "Proposals", "Reports"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">Invoicing</div>
            <div className="px-2 py-1 rounded-md text-[10px] text-white" style={{ backgroundColor: teal }}>+ Create Invoice</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <MetricCard label="Outstanding" value="$24.8K" sub="5 invoices" />
            <MetricCard label="Collected (MTD)" value="$62.4K" />
            <MetricCard label="Overdue" value="$3,200" sub="2 invoices" />
            <MetricCard label="Revenue (YTD)" value="$187K" sub="+22% vs last year" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <DataRow header cells={["Invoice #", "Client", "Amount", "Status", "Due Date"]} />
            <DataRow cells={["INV-1042", "Six Figure Room", "$8,500.00", <StatusBadge label="Paid" color="green" />, "Mar 1"]} />
            <DataRow cells={["INV-1043", "Peak Events", "$5,200.00", <StatusBadge label="Sent" color="blue" />, "Mar 15"]} />
            <DataRow cells={["INV-1044", "Acme Corp", "$12,000.00", <StatusBadge label="Pending" color="yellow" />, "Mar 20"]} />
            <DataRow cells={["INV-1045", "Bloom Studio", "$3,200.00", <StatusBadge label="Overdue" color="red" />, "Mar 5"]} />
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function WorkflowsMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/workflows">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Workflows" items={["Dashboard", "Clients", "Workflows", "Tasks", "Settings"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">Automation Workflows</div>
            <div className="px-2 py-1 rounded-md text-[10px] text-white" style={{ backgroundColor: teal }}>+ New Workflow</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="text-xs font-semibold text-gray-900 mb-3">Client Onboarding Workflow</div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { label: "Trigger", sub: "Lead Won", color: "#3B82F6" },
                { label: "Action", sub: "Create Client", color: teal },
                { label: "Action", sub: "Send Welcome Email", color: teal },
                { label: "Wait", sub: "1 Day", color: "#F59E0B" },
                { label: "Action", sub: "Assign Tasks", color: teal },
                { label: "Action", sub: "Notify Team", color: "#8B5CF6" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2 flex-shrink-0">
                  <div className="bg-white rounded-lg border-2 p-2 min-w-[90px] text-center" style={{ borderColor: step.color }}>
                    <div className="text-[9px] font-medium" style={{ color: step.color }}>{step.label}</div>
                    <div className="text-[10px] font-medium text-gray-900 mt-0.5">{step.sub}</div>
                  </div>
                  {i < 5 && <div className="text-gray-300 flex-shrink-0">&rarr;</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <DataRow header cells={["Workflow", "Trigger", "Runs", "Status"]} />
            <DataRow cells={["Client Onboarding", "Lead Won", "142", <StatusBadge label="Active" color="green" />]} />
            <DataRow cells={["Task Reminder", "Due Date -1 Day", "2,340", <StatusBadge label="Active" color="green" />]} />
            <DataRow cells={["Health Alert", "Score < Yellow", "28", <StatusBadge label="Active" color="green" />]} />
            <DataRow cells={["Invoice Follow-Up", "Overdue 3 Days", "67", <StatusBadge label="Paused" color="yellow" />]} />
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function TicketsMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/tickets">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Tickets" items={["Dashboard", "Clients", "Tickets", "Tasks", "Reports"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">Support Tickets</div>
            <div className="flex gap-2">
              <div className="px-2 py-1 rounded-md text-[10px] bg-gray-100 text-gray-600">All Tickets</div>
              <div className="px-2 py-1 rounded-md text-[10px] text-white" style={{ backgroundColor: teal }}>+ New Ticket</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <MetricCard label="Open" value="8" sub="3 high priority" />
            <MetricCard label="In Progress" value="5" />
            <MetricCard label="Avg. Response" value="2.4h" sub="Target: 4h" />
            <MetricCard label="Resolved (Week)" value="23" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <DataRow header cells={["Ticket", "Client", "Priority", "Assignee", "Status"]} />
            <DataRow cells={[
              <span className="font-medium">Website displaying 404</span>,
              "Acme Corp",
              <StatusBadge label="High" color="red" />,
              <AvatarCircle initials="JH" />,
              <StatusBadge label="Open" color="red" />
            ]} />
            <DataRow cells={[
              <span className="font-medium">Update ad copy</span>,
              "Peak Events",
              <StatusBadge label="Medium" color="yellow" />,
              <AvatarCircle initials="SM" color="#EC4899" />,
              <StatusBadge label="In Progress" color="blue" />
            ]} />
            <DataRow cells={[
              <span className="font-medium">Add blog post</span>,
              "Bloom Studio",
              <StatusBadge label="Low" color="gray" />,
              <AvatarCircle initials="AL" color="#8B5CF6" />,
              <StatusBadge label="Open" color="yellow" />
            ]} />
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function TrainingMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/training">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Training" items={["Dashboard", "Training", "Courses", "Analytics", "Settings"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">Training Center</div>
            <div className="px-2 py-1 rounded-md text-[10px] text-white" style={{ backgroundColor: teal }}>+ Create Course</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <MetricCard label="Active Courses" value="12" />
            <MetricCard label="Enrolled Staff" value="8" />
            <MetricCard label="Completion Rate" value="76%" sub="+4% this month" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { title: "SEO Fundamentals", lessons: 8, progress: 100, status: "Completed" },
              { title: "Google Ads Mastery", lessons: 12, progress: 65, status: "In Progress" },
              { title: "Client Communication", lessons: 6, progress: 33, status: "In Progress" },
            ].map((course) => (
              <div key={course.title} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="text-xs font-semibold text-gray-900 mb-1">{course.title}</div>
                <div className="text-[10px] text-gray-500 mb-2">{course.lessons} lessons</div>
                <ProgressBar value={course.progress} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-gray-500">{course.progress}%</span>
                  <StatusBadge label={course.status} color={course.progress === 100 ? "green" : "blue"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function HRMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/hr">
      <div className="flex min-h-[340px]">
        <MockSidebar active="HR & Team" items={["Dashboard", "HR & Team", "Time Off", "Directory", "Settings"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">HR & Team Management</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <MetricCard label="Team Members" value="12" />
            <MetricCard label="PTO Pending" value="3" sub="Needs approval" />
            <MetricCard label="Avg. Utilization" value="84%" />
            <MetricCard label="Open Positions" value="2" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <DataRow header cells={["Employee", "Department", "Role", "Status", "Time Off"]} />
            <DataRow cells={[
              <div className="flex items-center gap-1.5"><AvatarCircle initials="JH" /><span className="font-medium">Joe Hupp</span></div>,
              "Management",
              "CEO",
              <StatusBadge label="Active" color="green" />,
              "2 days left"
            ]} />
            <DataRow cells={[
              <div className="flex items-center gap-1.5"><AvatarCircle initials="SM" color="#EC4899" /><span className="font-medium">Sarah Miller</span></div>,
              "Creative",
              "Designer",
              <StatusBadge label="Active" color="green" />,
              "8 days left"
            ]} />
            <DataRow cells={[
              <div className="flex items-center gap-1.5"><AvatarCircle initials="AL" color="#8B5CF6" /><span className="font-medium">Alex Lee</span></div>,
              "Marketing",
              "Strategist",
              <StatusBadge label="On PTO" color="yellow" />,
              "0 days left"
            ]} />
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function HiringMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/hiring">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Hiring" items={["Dashboard", "HR & Team", "Hiring", "Careers", "Settings"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">Hiring Pipeline</div>
            <div className="px-2 py-1 rounded-md text-[10px] text-white" style={{ backgroundColor: teal }}>+ Post Job</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <MetricCard label="Open Positions" value="3" />
            <MetricCard label="Total Applicants" value="47" sub="12 this week" />
            <MetricCard label="In Interview" value="8" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <KanbanColumn title="Applied" color="#94A3B8" cards={[
              { name: "Jane Cooper", sub: "Content Writer", badge: "New", badgeColor: "blue" },
              { name: "Tom Wilson", sub: "PPC Specialist" },
              { name: "Maria Garcia", sub: "Designer", badge: "New", badgeColor: "blue" },
            ]} />
            <KanbanColumn title="Screening" color="#F59E0B" cards={[
              { name: "David Kim", sub: "Account Manager", badge: "Reviewed", badgeColor: "yellow" },
            ]} />
            <KanbanColumn title="Interview" color={teal} cards={[
              { name: "Lisa Chen", sub: "Strategist", badge: "Round 2", badgeColor: "teal" },
              { name: "Mike Brown", sub: "Developer" },
            ]} />
            <KanbanColumn title="Offer" color="#22C55E" cards={[
              { name: "Emma White", sub: "Account Manager", badge: "Accepted", badgeColor: "green" },
            ]} />
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function KnowledgeBaseMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/knowledge-base">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Knowledge Base" items={["Dashboard", "Knowledge Base", "Training", "Tasks", "Settings"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">Knowledge Base</div>
            <div className="flex gap-2">
              <div className="px-2 py-1 rounded text-[10px] bg-gray-100 text-gray-600">Search articles...</div>
              <div className="px-2 py-1 rounded-md text-[10px] text-white" style={{ backgroundColor: teal }}>+ New Article</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {[
              { cat: "Processes", count: 12, icon: "📋" },
              { cat: "Client SOPs", count: 8, icon: "📖" },
              { cat: "Templates", count: 15, icon: "📄" },
            ].map((c) => (
              <div key={c.cat} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
                <div className="text-xl">{c.icon}</div>
                <div>
                  <div className="text-xs font-semibold text-gray-900">{c.cat}</div>
                  <div className="text-[10px] text-gray-500">{c.count} articles</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <DataRow header cells={["Article", "Category", "Updated", "Views"]} />
            <DataRow cells={[<span className="font-medium">Client Onboarding Checklist</span>, "Processes", "Mar 14", "234"]} />
            <DataRow cells={[<span className="font-medium">Social Media Posting Guide</span>, "Client SOPs", "Mar 12", "189"]} />
            <DataRow cells={[<span className="font-medium">SEO Audit Template</span>, "Templates", "Mar 10", "156"]} />
            <DataRow cells={[<span className="font-medium">Ad Creative Brief</span>, "Templates", "Mar 8", "142"]} />
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function ClientOnboardingMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/onboarding">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Onboarding" items={["Dashboard", "Clients", "Onboarding", "Tasks", "Settings"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">Client Onboarding</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AvatarCircle initials="PE" color="#EC4899" />
                <div>
                  <div className="text-xs font-semibold text-gray-900">Peak Events</div>
                  <div className="text-[10px] text-gray-500">Started Mar 10, 2026</div>
                </div>
              </div>
              <StatusBadge label="Day 3 of 14" color="blue" />
            </div>
            <ProgressBar value={45} />
            <div className="mt-3 space-y-2">
              {[
                { task: "Welcome email sent", done: true },
                { task: "Access credentials shared", done: true },
                { task: "Discovery call completed", done: true },
                { task: "Brand assets collected", done: false },
                { task: "Strategy presentation", done: false },
                { task: "Campaign kickoff", done: false },
              ].map((item) => (
                <div key={item.task} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] ${item.done ? "text-white" : "border-gray-300"}`} style={item.done ? { backgroundColor: teal, borderColor: teal } : undefined}>
                    {item.done && "✓"}
                  </div>
                  <span className={`text-[11px] ${item.done ? "text-gray-500 line-through" : "text-gray-900"}`}>{item.task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function ClientPortalMockup() {
  return (
    <BrowserChrome url="portal.agencyboost.com">
      <div className="min-h-[340px] p-4" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: teal }}>AB</div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Welcome back, Sarah</div>
                <div className="text-[10px] text-gray-500">Peak Events Portal</div>
              </div>
            </div>
            <StatusBadge label="Client Portal" color="teal" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <MetricCard label="Active Tasks" value="5" sub="2 need your input" />
            <MetricCard label="Open Tickets" value="1" />
            <MetricCard label="Next Meeting" value="Mar 18" sub="Strategy Review" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="text-xs font-semibold text-gray-900 mb-2">Recent Updates</div>
              <div className="space-y-2">
                <div className="text-[10px] text-gray-700 flex items-start gap-2"><span style={{ color: teal }}>●</span>Ad campaign performance report ready</div>
                <div className="text-[10px] text-gray-700 flex items-start gap-2"><span style={{ color: teal }}>●</span>New blog post draft for your review</div>
                <div className="text-[10px] text-gray-700 flex items-start gap-2"><span style={{ color: teal }}>●</span>Social media calendar updated</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="text-xs font-semibold text-gray-900 mb-2">Quick Actions</div>
              <div className="space-y-1.5">
                <div className="text-[10px] px-2 py-1.5 rounded-md border border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50">Submit a Support Ticket</div>
                <div className="text-[10px] px-2 py-1.5 rounded-md border border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50">View Invoices & Payments</div>
                <div className="text-[10px] px-2 py-1.5 rounded-md border border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50">Schedule a Meeting</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function SocialMediaMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/social-media">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Social Media" items={["Dashboard", "Social Media", "Campaigns", "Calendar", "Reports"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">Social Media Manager</div>
            <div className="px-2 py-1 rounded-md text-[10px] text-white" style={{ backgroundColor: teal }}>+ Create Post</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <MetricCard label="Scheduled Posts" value="18" sub="This week" />
            <MetricCard label="Published" value="42" sub="This month" />
            <MetricCard label="Engagement Rate" value="4.2%" sub="+0.8% vs avg" />
            <MetricCard label="Total Reach" value="24.5K" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-xs font-semibold text-gray-900 mb-3">Content Calendar — This Week</div>
            <div className="grid grid-cols-5 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
                <div key={day} className="border border-gray-200 rounded-md p-2 min-h-[80px]">
                  <div className="text-[10px] font-medium text-gray-500 mb-1">{day}</div>
                  {i === 0 && <div className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 mb-1">IG Carousel</div>}
                  {i === 1 && <div className="text-[9px] px-1 py-0.5 rounded bg-red-100 text-red-700 mb-1">YT Short</div>}
                  {i === 2 && <><div className="text-[9px] px-1 py-0.5 rounded bg-sky-100 text-sky-700 mb-1">Twitter Thread</div><div className="text-[9px] px-1 py-0.5 rounded bg-purple-100 text-purple-700">TikTok</div></>}
                  {i === 3 && <div className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 mb-1">FB Post</div>}
                  {i === 4 && <div className="text-[9px] px-1 py-0.5 rounded bg-pink-100 text-pink-700 mb-1">IG Story</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

export function CallCenterMockup() {
  return (
    <BrowserChrome url="app.agencyboost.com/call-center">
      <div className="flex min-h-[340px]">
        <MockSidebar active="Call Center" items={["Dashboard", "Call Center", "Contacts", "Call Logs", "Settings"]} />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-900">Call Center</div>
            <div className="flex gap-2">
              <div className="px-2 py-1 rounded-md text-[10px] bg-green-100 text-green-700">Online</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <MetricCard label="Calls Today" value="23" sub="+5 vs yesterday" />
            <MetricCard label="Avg. Duration" value="4:32" />
            <MetricCard label="Missed" value="2" sub="Callbacks pending" />
            <MetricCard label="Active Now" value="1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-lg border-2 p-3" style={{ borderColor: teal }}>
              <div className="text-xs font-semibold text-gray-900 mb-2">Dialer</div>
              <div className="grid grid-cols-3 gap-1 mb-2">
                {["1","2","3","4","5","6","7","8","9","*","0","#"].map(n => (
                  <div key={n} className="bg-gray-50 rounded-md text-center py-1.5 text-xs font-medium text-gray-700">{n}</div>
                ))}
              </div>
              <div className="w-full py-1.5 rounded-md text-center text-xs text-white font-medium" style={{ backgroundColor: teal }}>Call</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="text-xs font-semibold text-gray-900 mb-2">Recent Calls</div>
              <div className="space-y-2">
                {[
                  { name: "Joe Hupp", time: "2 min ago", type: "Outbound", dur: "5:12" },
                  { name: "Sarah @ Peak", time: "15 min ago", type: "Inbound", dur: "3:45" },
                  { name: "Mike @ Acme", time: "1 hr ago", type: "Missed", dur: "--" },
                ].map(call => (
                  <div key={call.name} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <AvatarCircle initials={call.name.split(' ').map(n => n[0]).join('')} />
                      <div>
                        <div className="font-medium text-gray-900">{call.name}</div>
                        <div className="text-gray-500">{call.time}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={call.type === "Missed" ? "text-red-500" : "text-gray-700"}>{call.type}</div>
                      <div className="text-gray-400">{call.dur}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}
