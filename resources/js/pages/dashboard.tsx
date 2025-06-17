import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Interfaces for data types received from the backend
interface SummaryCardData {
    title: string;
    value: string | number;
}

interface Cycle {
    id: number;
    name: string;
    status: 'active' | 'upcoming' | 'completed' | string; // Allow string for backend flexibility
    startDate: string;
    endDate: string;
    totalPot?: string | number;
}

interface Payout {
    id: number;
    memberName: string;
    amount: string | number;
    dueDate: string; // Backend will provide this, could be 'N/A' or a date string
    status: 'scheduled' | 'completed' | 'failed' | string; // Allow string
}

interface CycleTrackerData {
    activeCycles: Cycle[];
    upcomingPayouts: Payout[];
}

interface MemberHealthData {
    overdueContributions?: number;
    engagementRate?: number;
}

// Props for the main Dashboard page component that Inertia will pass
interface DashboardPageProps {
    summaryCardsData: SummaryCardData[];
    cycleTrackerData: CycleTrackerData;
    memberHealthData: MemberHealthData;
}

// Component for individual summary cards
const SummaryCard: React.FC<SummaryCardData> = ({ title, value }) => (
    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-2xl">{value}</p>
    </div>
);

// Component for Cycle & Payout Tracker
const CyclePayoutTracker: React.FC<CycleTrackerData> = ({ activeCycles = [], upcomingPayouts = [] }) => (
    <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[300px] flex-1 overflow-hidden rounded-xl border p-4 md:min-h-min">
        <h3 className="text-xl font-semibold mb-4">Cycle & Payout Tracker</h3>

        {activeCycles.length > 0 && (
            <div className="mb-4">
                <h4 className="text-lg font-medium mb-2">Active Cycles</h4>
                <ul className="space-y-2">
                    {activeCycles.map(cycle => (
                        <li key={cycle.id} className="p-2 border-b border-gray-200 dark:border-gray-700">
                            <p className="font-semibold">{cycle.name} ({cycle.status})</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {cycle.startDate} - {cycle.endDate}
                                {cycle.totalPot && ` | Pot: ${cycle.totalPot}`}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {upcomingPayouts.length > 0 && (
            <div>
                <h4 className="text-lg font-medium mb-2">Upcoming Payouts</h4>
                <ul className="space-y-2">
                    {upcomingPayouts.map(payout => (
                        <li key={payout.id} className="p-2 border-b border-gray-200 dark:border-gray-700">
                            <p className="font-semibold">{payout.memberName} - {payout.amount}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {payout.dueDate && payout.dueDate !== 'N/A' ? `Due: ${payout.dueDate} ` : ''}
                                ({payout.status})
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {activeCycles.length === 0 && upcomingPayouts.length === 0 && (
            <p>No active cycles or upcoming payouts to display.</p>
        )}
    </div>
);

// Component for Member Health Snapshot
const MemberHealthSnapshot: React.FC<MemberHealthData> = ({ overdueContributions, engagementRate }) => (
    <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[300px] flex-1 overflow-hidden rounded-xl border p-4 md:min-h-min">
        <h3 className="text-xl font-semibold mb-2">Member Health Snapshot</h3>
        {typeof overdueContributions !== 'undefined' && (
            <p className="mb-1">Overdue Contributions: {overdueContributions}</p>
        )}
        {typeof engagementRate !== 'undefined' && (
            <p className="mb-1">Engagement Rate: {engagementRate}%</p>
        )}
        {(typeof overdueContributions === 'undefined' || overdueContributions === 0) &&
            (typeof engagementRate === 'undefined') && (
                <p>No specific member health data to display currently.</p>
            )}
    </div>
);

export default function Dashboard({ summaryCardsData, cycleTrackerData, memberHealthData }: DashboardPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* High-Level Summary Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {summaryCardsData.map((card, index) => (
                        <SummaryCard key={index} title={card.title} value={card.value} />
                    ))}
                </div>

                {/* Cycle & Payout Tracker and Member Health Snapshot */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-1 lg:grid-cols-2">
                    <CyclePayoutTracker
                        activeCycles={cycleTrackerData.activeCycles}
                        upcomingPayouts={cycleTrackerData.upcomingPayouts}
                    />
                    <MemberHealthSnapshot {...memberHealthData} />
                </div>
            </div>
        </AppLayout>
    );
}
