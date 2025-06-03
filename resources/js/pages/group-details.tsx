import AppLayout from '@/layouts/app-layout';
import {type BreadcrumbItem, type Group, type Client, type Cycle, type Contribution, type Payout} from '@/types';
import {Head} from '@inertiajs/react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';

interface EnrichedContribution extends Omit<Contribution, 'paid_at'> {
    member_name: string;
    contribution_date: string | null; // Derived from paid_at or created_at
}

interface EnrichedPayout extends Omit<Payout, 'paid_at'> {
    member_name: string;
    payout_date: string | null; // Derived from paid_at
}

interface EnrichedCycle extends Cycle { // Cycle already has start_date, end_date from types/index.d.ts
    contributions: EnrichedContribution[];
    payouts: EnrichedPayout[];
}

interface EnrichedGroup extends Group {
    members: Array<{ client: Client; pivot?: { joined_at: string; position: number; } }>; // Added position to pivot
    cycles: Array<EnrichedCycle>;
}

interface GroupDetailsPageProps {
    group: EnrichedGroup;
}

export default function GroupDetailsPage({group}: GroupDetailsPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Groups',
            href: route('groups.index'),
        },
        {
            title: group.name,
            href: route('groups.show', group.group_id),
            isActive: true,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Group Details - ${group.name}`}/>
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{group.name}</CardTitle>
                        <CardDescription>{group.description || 'No description available.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p><strong>ID:</strong> {group.group_id}</p>
                        <p><strong>Status:</strong> <span className="capitalize">{group.status}</span></p>
                        <p><strong>Current Cycle:</strong> {group.current_cycle ?? 'N/A'}</p>
                        <p><strong>Created At:</strong> {group.created_at ? new Date(group.created_at).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Last Updated:</strong> {group.status_changed_at ? new Date(group.status_changed_at).toLocaleDateString() : 'N/A'}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Members ({group.members?.length || 0})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {group.members && group.members.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Position (Payout Date)</TableHead> {/* New Header */}
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone number</TableHead>
                                        <TableHead>Joined At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.members.map((member) => {
                                        const memberPosition = member.pivot?.position;
                                        let payoutDateDisplay = 'N/A';

                                        if (memberPosition !== undefined && group.cycles) {
                                            const relevantCycle = group.cycles.find(
                                                (cycle) => cycle.cycle_number === memberPosition
                                            );
                                            if (relevantCycle?.start_date) {
                                                payoutDateDisplay = new Date(relevantCycle.start_date)
                                                    .toLocaleString('default', {month: 'long', year: 'numeric'});
                                            }
                                        }

                                        return (
                                            <TableRow key={member.client.client_id}>
                                                <TableCell>{payoutDateDisplay}</TableCell> {/* New Cell */}
                                                <TableCell>{member.client.first_name} {member.client.last_name}</TableCell>
                                                <TableCell>{member.client.email || 'N/A'}</TableCell>
                                                <TableCell>{member.client.phone || 'N/A'}</TableCell>
                                                <TableCell>{member.pivot?.joined_at ? new Date(member.pivot.joined_at).toLocaleDateString() : 'N/A'}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <p>No members in this group.</p>
                        )}
                    </CardContent>
                </Card>

                {group.cycles && group.cycles.map(cycle => (
                    <Card key={cycle.cycle_id}>
                        <CardHeader>
                            <CardTitle>Cycle {cycle.cycle_number} (Status: <span className="capitalize">{cycle.status}</span>)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p><strong>Start
                                Date:</strong> {cycle.start_date ? new Date(cycle.start_date).toLocaleDateString() : 'N/A'}
                            </p>
                            <p><strong>End
                                Date:</strong> {cycle.end_date ? new Date(cycle.end_date).toLocaleDateString() : 'N/A'}
                            </p>
                            <p><strong>Contribution Amount:</strong> {cycle.contribution_amount ?? 'N/A'}</p>


                            <h4 className="mt-4 text-lg font-semibold">Contributions</h4>
                            {cycle.contributions && cycle.contributions.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cycle.contributions.map(c => (
                                            <TableRow key={c.contribution_id}>
                                                <TableCell>{c.member_name}</TableCell>
                                                <TableCell>{c.amount}</TableCell>
                                                <TableCell>{c.contribution_date ? new Date(c.contribution_date).toLocaleDateString() : 'N/A'}</TableCell>
                                                <TableCell><span className="capitalize">{c.status}</span></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (<p>No contributions for this cycle.</p>)}

                            <h4 className="mt-4 text-lg font-semibold">Payouts</h4>
                            {cycle.payouts && cycle.payouts.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cycle.payouts.map(p => (
                                            <TableRow key={p.payout_id}>
                                                <TableCell>{p.member_name}</TableCell>
                                                <TableCell>{p.amount}</TableCell>
                                                <TableCell>{p.payout_date ? new Date(p.payout_date).toLocaleDateString() : 'N/A'}</TableCell>
                                                <TableCell><span className="capitalize">{p.status}</span></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (<p>No payouts for this cycle.</p>)}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </AppLayout>
    );
}
