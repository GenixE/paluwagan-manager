import AppLayout from '@/layouts/app-layout';
import {type BreadcrumbItem, type Group, type Client, type Cycle, type Contribution, type Payout} from '@/types';
import {Head} from '@inertiajs/react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import React from 'react'; // Added React for potential hook usage if expanded

// Interface for a single member within the EnrichedGroup
interface GroupMember {
    client: Client;
    pivot?: {
        joined_at: string;
        position: number;
    };
}

interface EnrichedContribution extends Omit<Contribution, 'paid_at'> {
    member_name: string;
    contribution_date: string | null;
    notes?: string | null;
}

interface EnrichedPayout extends Omit<Payout, 'paid_at'> {
    member_name: string;
    payout_date: string | null;
}

interface EnrichedCycle extends Cycle {
    contributions: EnrichedContribution[];
    payouts: EnrichedPayout[];
}

interface EnrichedGroup extends Group {
    members: GroupMember[];
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

    const memberColumns: ColumnDef<GroupMember>[] = React.useMemo(() => [
        {
            header: 'Position (Payout Date)',
            accessorKey: 'pivot.position',
            cell: ({ row }) => {
                const member = row.original;
                const memberPosition = member.pivot?.position;
                let payoutDateDisplay = 'N/A';

                if (memberPosition !== undefined && group.cycles) {
                    const relevantCycle = group.cycles.find(
                        (cycle) => cycle.cycle_number === memberPosition
                    );
                    if (relevantCycle?.start_date) {
                        payoutDateDisplay = new Date(relevantCycle.start_date)
                            .toLocaleString('default', { month: 'long', year: 'numeric' });
                    }
                }
                return payoutDateDisplay;
            },
        },
        {
            header: 'Name',
            accessorFn: (row) => `${row.client.first_name} ${row.client.last_name}`,
            cell: info => info.getValue(),
        },
        {
            header: 'Email',
            accessorKey: 'client.email',
            cell: ({ row }) => row.original.client.email || 'N/A',
        },
        {
            header: 'Phone number',
            accessorKey: 'client.phone',
            cell: ({ row }) => row.original.client.phone || 'N/A',
        },
        {
            header: 'Joined At',
            accessorKey: 'pivot.joined_at',
            cell: ({ row }) => row.original.pivot?.joined_at ? new Date(row.original.pivot.joined_at).toLocaleDateString() : 'N/A',
        },
    ], [group.cycles]);

    const membersTable = useReactTable({
        data: group.members || [],
        columns: memberColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    // Columns for Contributions (can be defined outside or inside if they depend on cycle-specific data)
    const contributionColumns: ColumnDef<EnrichedContribution>[] = React.useMemo(() => [
        { accessorKey: 'member_name', header: 'Member' },
        { accessorKey: 'amount', header: 'Amount', cell: info => info.getValue() },
        {
            accessorKey: 'contribution_date',
            header: 'Date',
            cell: ({ row }) => row.original.contribution_date ? new Date(row.original.contribution_date).toLocaleDateString() : 'N/A',
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <span className="capitalize">{row.original.status}</span>,
        },
        {
            accessorKey: 'notes',
            header: 'Notes',
            cell: ({ row }) => row.original.notes || 'N/A',
        },
    ], []);

    // Columns for Payouts
    const payoutColumns: ColumnDef<EnrichedPayout>[] = React.useMemo(() => [
        { accessorKey: 'member_name', header: 'Member' },
        { accessorKey: 'amount', header: 'Amount', cell: info => info.getValue() },
        {
            accessorKey: 'payout_date',
            header: 'Date',
            cell: ({ row }) => row.original.payout_date ? new Date(row.original.payout_date).toLocaleDateString() : 'N/A',
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <span className="capitalize">{row.original.status}</span>,
        },
    ], []);

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
                            <div className="overflow-hidden rounded-md border">
                                <Table>
                                    <TableHeader>
                                        {membersTable.getHeaderGroups().map(headerGroup => (
                                            <TableRow key={headerGroup.id}>
                                                {headerGroup.headers.map(header => (
                                                    <TableHead key={header.id}>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableHeader>
                                    <TableBody>
                                        {membersTable.getRowModel().rows?.length ? (
                                            membersTable.getRowModel().rows.map(row => (
                                                <TableRow key={row.id}>
                                                    {row.getVisibleCells().map(cell => (
                                                        <TableCell key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={memberColumns.length} className="h-24 text-center">
                                                    No members.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p>No members in this group.</p>
                        )}
                    </CardContent>
                </Card>

                {group.cycles && group.cycles.map(cycle => {
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    const contributionsTable = useReactTable({
                        data: cycle.contributions || [],
                        columns: contributionColumns,
                        getCoreRowModel: getCoreRowModel(),
                    });

                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    const payoutsTable = useReactTable({
                        data: cycle.payouts || [],
                        columns: payoutColumns,
                        getCoreRowModel: getCoreRowModel(),
                    });

                    return (
                        <Card key={cycle.cycle_id}>
                            <CardHeader>
                                <CardTitle>Cycle {cycle.cycle_number} (Status: <span className="capitalize">{cycle.status}</span>)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p><strong>Start Date:</strong> {cycle.start_date ? new Date(cycle.start_date).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>End Date:</strong> {cycle.end_date ? new Date(cycle.end_date).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>Contribution Amount:</strong> {cycle.contribution_amount ?? 'N/A'}</p>

                                <h4 className="mt-4 text-lg font-semibold">Contributions</h4>
                                {cycle.contributions && cycle.contributions.length > 0 ? (
                                    <div className="overflow-hidden rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                {contributionsTable.getHeaderGroups().map(headerGroup => (
                                                    <TableRow key={headerGroup.id}>
                                                        {headerGroup.headers.map(header => (
                                                            <TableHead key={header.id}>
                                                                {header.isPlaceholder
                                                                    ? null
                                                                    : flexRender(
                                                                        header.column.columnDef.header,
                                                                        header.getContext()
                                                                    )}
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableHeader>
                                            <TableBody>
                                                {contributionsTable.getRowModel().rows?.length ? (
                                                    contributionsTable.getRowModel().rows.map(row => (
                                                        <TableRow key={row.id}>
                                                            {row.getVisibleCells().map(cell => (
                                                                <TableCell key={cell.id}>
                                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={contributionColumns.length} className="h-24 text-center">
                                                            No contributions.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (<p>No contributions for this cycle.</p>)}

                                <h4 className="mt-4 text-lg font-semibold">Payouts</h4>
                                {cycle.payouts && cycle.payouts.length > 0 ? (
                                    <div className="overflow-hidden rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                {payoutsTable.getHeaderGroups().map(headerGroup => (
                                                    <TableRow key={headerGroup.id}>
                                                        {headerGroup.headers.map(header => (
                                                            <TableHead key={header.id}>
                                                                {header.isPlaceholder
                                                                    ? null
                                                                    : flexRender(
                                                                        header.column.columnDef.header,
                                                                        header.getContext()
                                                                    )}
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableHeader>
                                            <TableBody>
                                                {payoutsTable.getRowModel().rows?.length ? (
                                                    payoutsTable.getRowModel().rows.map(row => (
                                                        <TableRow key={row.id}>
                                                            {row.getVisibleCells().map(cell => (
                                                                <TableCell key={cell.id}>
                                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={payoutColumns.length} className="h-24 text-center">
                                                            No payouts.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (<p>No payouts for this cycle.</p>)}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </AppLayout>
    );
}
