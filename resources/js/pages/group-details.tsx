import AppLayout from '@/layouts/app-layout';
import {type BreadcrumbItem, type Group, type Client, type Cycle, type Contribution, type Payout as BasePayoutType} from '@/types'; // Renamed Payout to BasePayoutType
import {Head, router, useForm} from '@inertiajs/react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Interface for a single member within the EnrichedGroup
interface GroupMember {
    group_member_id: number;
    client: Client;
    pivot?: {
        joined_at: string;
        position: number;
    };
}

interface EnrichedContribution {
    contribution_id: number;
    group_member_id: number;
    member_name: string;
    amount: number;
    status: 'pending' | 'paid' | 'missed';
    contribution_date: string | null;
    notes?: string | null;
}

// Updated EnrichedPayout interface
interface EnrichedPayout {
    payout_id: number;
    member_id: number; // This is group_member_id
    member_name: string;
    amount: number;
    status: 'scheduled' | 'completed' | 'failed';
    payout_date: string | null; // Formatted paid_at or relevant date
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
    allClients: Array<{ client_id: number; first_name: string; last_name: string; }>;
    errors?: Record<string, string | string[]>;
}

interface CycleTabContentProps {
    cycle: EnrichedCycle;
    // payoutColumns: ColumnDef<EnrichedPayout>[]; // Will be defined locally
    onEditCycle: (cycle: EnrichedCycle) => void;
    onDeleteCycle: (cycleId: number) => void;
    groupMembers: GroupMember[];
    onAddContribution: (cycle: EnrichedCycle) => void;
    onEditContribution: (contribution: EnrichedContribution, cycle: EnrichedCycle) => void;
    onDeleteContribution: (contributionId: number, cycleId: number) => void;
    onAddPayout: (cycle: EnrichedCycle) => void; // New prop
    onEditPayout: (payout: EnrichedPayout, cycle: EnrichedCycle) => void; // New prop
    onDeletePayout: (payoutId: number, cycleId: number) => void; // New prop
    groupId: number;
}

function CycleTabContent({
                             cycle,
                             // payoutColumns, // Removed
                             onEditCycle,
                             onDeleteCycle,
                             groupMembers, // Needed for add/edit payout modal if it were here
                             onAddContribution,
                             onEditContribution,
                             onDeleteContribution,
                             onAddPayout, // New
                             onEditPayout, // New
                             onDeletePayout, // New
                             groupId
                         }: CycleTabContentProps) {

    const localContributionColumns = useMemo<ColumnDef<EnrichedContribution>[]>(() => [
        { accessorKey: 'member_name', header: 'Member' },
        { accessorKey: 'amount', header: 'Amount', cell: info => info.getValue() },
        {
            accessorKey: 'contribution_date',
            header: 'Date',
            cell: ({ row }) => row.original.contribution_date ? new Date(row.original.contribution_date).toLocaleDateString() : 'N/A'
        },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => <span className="capitalize">{row.original.status}</span> },
        { accessorKey: 'notes', header: 'Notes', cell: ({ row }) => row.original.notes || 'N/A' },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const contribution = row.original;
                return (
                    <div className="space-x-2">
                        <Button variant="outline" size="xs" onClick={() => onEditContribution(contribution, cycle)}>Edit</Button>
                        <Button variant="destructive" size="xs" onClick={() => onDeleteContribution(contribution.contribution_id, cycle.cycle_id)}>Delete</Button>
                    </div>
                );
            },
        },
    ], [cycle, onEditContribution, onDeleteContribution]);

    const contributionsTable = useReactTable({
        data: cycle.contributions || [],
        columns: localContributionColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    const localPayoutColumns = useMemo<ColumnDef<EnrichedPayout>[]>(() => [
        { accessorKey: 'member_name', header: 'Member' },
        { accessorKey: 'amount', header: 'Amount', cell: info => info.getValue() },
        {
            accessorKey: 'payout_date',
            header: 'Date',
            cell: ({ row }) => row.original.payout_date ? new Date(row.original.payout_date).toLocaleDateString() : 'N/A'
        },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => <span className="capitalize">{row.original.status}</span> },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const payout = row.original;
                return (
                    <div className="space-x-2">
                        <Button variant="outline" size="xs" onClick={() => onEditPayout(payout, cycle)}>Edit</Button>
                        <Button variant="destructive" size="xs" onClick={() => onDeletePayout(payout.payout_id, cycle.cycle_id)}>Delete</Button>
                    </div>
                );
            },
        },
    ], [cycle, onEditPayout, onDeletePayout]);


    const payoutsTable = useReactTable({
        data: cycle.payouts || [],
        columns: localPayoutColumns, // Use localPayoutColumns
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <TabsContent value={`cycle-${cycle.cycle_id}`}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Cycle {cycle.cycle_number} (Status: <span className="capitalize">{cycle.status}</span>)</CardTitle>
                        <CardDescription>
                            Start: {cycle.start_date ? new Date(cycle.start_date).toLocaleDateString() : 'N/A'} -
                            End: {cycle.end_date ? new Date(cycle.end_date).toLocaleDateString() : 'N/A'}
                        </CardDescription>
                    </div>
                    <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => onEditCycle(cycle)}>Edit Cycle</Button>
                        <Button variant="destructive" size="sm" onClick={() => onDeleteCycle(cycle.cycle_id)}>Delete Cycle</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <p><strong>Contribution Amount:</strong> {cycle.contribution_amount ?? 'N/A'}</p>

                    <div className="mt-4 flex items-center justify-between">
                        <h4 className="text-lg font-semibold">Contributions</h4>
                        <Button size="sm" onClick={() => onAddContribution(cycle)}>Add Contribution</Button>
                    </div>
                    {cycle.contributions && cycle.contributions.length > 0 ? (
                        <div className="mt-2 overflow-hidden rounded-md border">
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
                                            <TableCell colSpan={localContributionColumns.length} className="h-24 text-center">
                                                No contributions.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (<p className="mt-2">No contributions for this cycle.</p>)}

                    <div className="mt-4 flex items-center justify-between">
                        <h4 className="text-lg font-semibold">Payouts</h4>
                        <Button size="sm" onClick={() => onAddPayout(cycle)}>Add Payout</Button> {/* Add Payout Button */}
                    </div>
                    {cycle.payouts && cycle.payouts.length > 0 ? (
                        <div className="mt-2 overflow-hidden rounded-md border">
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
                                            <TableCell colSpan={localPayoutColumns.length} className="h-24 text-center">
                                                No payouts.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (<p className="mt-2">No payouts for this cycle.</p>)}
                </CardContent>
            </Card>
        </TabsContent>
    );
}


export default function GroupDetailsPage({group, allClients}: GroupDetailsPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Groups', href: route('groups.index') },
        { title: group.name, href: route('groups.show', group.group_id), isActive: true },
    ];

    // Member Modal State and Form
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [memberModalMode, setMemberModalMode] = useState<'add' | 'edit'>('add');
    const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
    const { data: memberData, setData: setMemberData, post: postMember, put: putMember, errors: memberErrors, reset: resetMemberForm, processing: memberProcessing, clearErrors: clearMemberErrors } = useForm({
        client_id: '',
        position: '',
    });

    useEffect(() => {
        if (!isMemberModalOpen) clearMemberErrors();
    }, [isMemberModalOpen, clearMemberErrors]);


    const openAddMemberModal = () => {
        setMemberModalMode('add');
        resetMemberForm();
        setEditingMemberId(null);
        setIsMemberModalOpen(true);
    };

    const openEditMemberModal = (member: GroupMember) => {
        setMemberModalMode('edit');
        setEditingMemberId(member.group_member_id);
        setMemberData({
            client_id: member.client.client_id.toString(),
            position: member.pivot?.position?.toString() || '',
        });
        clearMemberErrors();
        setIsMemberModalOpen(true);
    };

    const handleMemberSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const commonOptions = {
            preserveScroll: true,
            onSuccess: () => {
                setIsMemberModalOpen(false);
                resetMemberForm();
                toast.success(`Member ${memberModalMode === 'add' ? 'added' : 'updated'} successfully!`);
                router.reload({ only: ['group'], preserveScroll: true, preserveState: true });
            },
            onError: (formErrors: Record<string, string | string[]>) => {
                console.error(`Error ${memberModalMode === 'add' ? 'adding' : 'updating'} member:`, formErrors);
                toast.error(`Failed to ${memberModalMode === 'add' ? 'add' : 'update'} member. Check form fields for details.`);
            },
        };
        if (memberModalMode === 'add') {
            postMember(route('groups.members.store', group.group_id), commonOptions);
        } else if (editingMemberId) {
            putMember(route('groups.members.update', { group: group.group_id, member: editingMemberId }), commonOptions);
        }
    };

    const handleDeleteMember = (memberId: number) => {
        if (confirm('Are you sure you want to delete this member?')) {
            router.delete(route('groups.members.destroy', { group: group.group_id, member: memberId }), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Member Deleted', { description: 'The member has been removed from the group.'});
                    router.reload({ only: ['group'], preserveScroll: true, preserveState: true });
                },
                onError: (errorResponse) => {
                    console.error('Error deleting member:', errorResponse);
                    toast.error('Error Deleting Member', { description: 'Failed to remove the member.' });
                },
            });
        }
    };

    // Cycle Modal State and Form
    const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
    const [cycleModalMode, setCycleModalMode] = useState<'add' | 'edit'>('add');
    const [editingCycle, setEditingCycle] = useState<EnrichedCycle | null>(null);

    const { data: cycleData, setData: setCycleData, post: postCycle, put: putCycle, errors: cycleErrors, reset: resetCycleForm, processing: cycleProcessing, clearErrors: clearCycleErrors } = useForm({
        cycle_number: '' as string | number,
        start_date: '',
        end_date: '',
        status: 'pending',
    });

    useEffect(() => {
        if (!isCycleModalOpen) {
            clearCycleErrors();
            setEditingCycle(null);
        }
    }, [isCycleModalOpen, clearCycleErrors]);

    const openAddCycleModal = () => {
        setCycleModalMode('add');
        resetCycleForm();
        setCycleData({
            cycle_number: group.cycles.length > 0 ? Math.max(0, ...group.cycles.map(c => c.cycle_number)) + 1 : 1,
            start_date: '',
            end_date: '',
            status: 'pending',
        });
        setEditingCycle(null);
        setIsCycleModalOpen(true);
    };

    const openEditCycleModal = (cycle: EnrichedCycle) => {
        setCycleModalMode('edit');
        setEditingCycle(cycle);
        setCycleData({
            cycle_number: cycle.cycle_number,
            start_date: cycle.start_date ? new Date(cycle.start_date).toISOString().split('T')[0] : '',
            end_date: cycle.end_date ? new Date(cycle.end_date).toISOString().split('T')[0] : '',
            status: cycle.status,
        });
        clearCycleErrors();
        setIsCycleModalOpen(true);
    };

    const handleCycleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const onSuccessShared = () => {
            setIsCycleModalOpen(false);
            toast.success(`Cycle ${cycleModalMode === 'add' ? 'added' : 'updated'} successfully!`);
            router.reload({ only: ['group'], preserveScroll: true, preserveState: true });
        };
        const onErrorShared = (formErrors: Record<string, string | string[]>) => {
            console.error(`Error ${cycleModalMode === 'add' ? 'adding' : 'updating'} cycle:`, formErrors);
            toast.error(`Failed to ${cycleModalMode === 'add' ? 'add' : 'update'} cycle. Check form for errors.`);
        };

        const dataPayload = {
            ...cycleData,
            cycle_number: cycleModalMode === 'add' ? Number(cycleData.cycle_number) : undefined, // Only send for add
        };


        if (cycleModalMode === 'add') {
            // For storing a new cycle, the route is 'groups.cycles.store'
            // It expects {group} as a parameter for the group ID.
            postCycle(route('groups.cycles.store', { group: group.group_id }), {
                data: dataPayload,
                onSuccess: onSuccessShared,
                onError: onErrorShared,
                preserveScroll: true,
            });
        } else if (editingCycle) {
            // For updating an existing cycle, the route is 'groups.cycles.update'
            // It expects {group} and {cycle} as parameters.
            putCycle(route('groups.cycles.update', { group: group.group_id, cycle: editingCycle.cycle_id }), {
                data: { // Only send updatable fields for PUT/PATCH
                    start_date: cycleData.start_date,
                    end_date: cycleData.end_date,
                    status: cycleData.status,
                },
                onSuccess: onSuccessShared,
                onError: onErrorShared,
                preserveScroll: true,
            });
        }
    };

    const handleDeleteCycle = (cycleId: number) => {
        if (confirm('Are you sure you want to delete this cycle? This action cannot be undone and might affect related data.')) {
            router.delete(route('groups.cycles.destroy', { group: group.group_id, cycle: cycleId }), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Cycle Deleted', { description: 'The cycle has been removed.' });
                    router.reload({ only: ['group'], preserveScroll: true, preserveState: true });
                },
                onError: (errorResponse) => {
                    console.error('Error deleting cycle:', errorResponse);
                    toast.error('Error Deleting Cycle', { description: 'Failed to remove the cycle.' });
                },
            });
        }
    };

    // Contribution Modal State and Form
    const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
    const [contributionModalMode, setContributionModalMode] = useState<'add' | 'edit'>('add');
    const [editingContribution, setEditingContribution] = useState<EnrichedContribution | null>(null);
    const [currentCycleForContribution, setCurrentCycleForContribution] = useState<EnrichedCycle | null>(null);

    const { data: contributionData, setData: setContributionData, post: postContribution, patch: patchContribution, errors: contributionErrors, reset: resetContributionForm, processing: contributionProcessing, clearErrors: clearContributionErrors } = useForm({
        member_id: '' as string | number,
        amount: '' as string | number,
        status: 'pending' as 'pending' | 'paid' | 'missed',
        notes: '',
    });

    useEffect(() => {
        if (!isContributionModalOpen) {
            clearContributionErrors();
            setEditingContribution(null);
            setCurrentCycleForContribution(null);
        }
    }, [isContributionModalOpen, clearContributionErrors]);

    const openAddContributionModal = (cycle: EnrichedCycle) => {
        setContributionModalMode('add');
        resetContributionForm();
        setContributionData('status', 'pending');
        setCurrentCycleForContribution(cycle);
        setEditingContribution(null);
        setIsContributionModalOpen(true);
    };

    const openEditContributionModal = (contribution: EnrichedContribution, cycle: EnrichedCycle) => {
        setContributionModalMode('edit');
        setEditingContribution(contribution);
        setCurrentCycleForContribution(cycle);
        setContributionData({
            member_id: contribution.group_member_id,
            amount: contribution.amount.toString(),
            status: contribution.status,
            notes: contribution.notes || '',
        });
        clearContributionErrors();
        setIsContributionModalOpen(true);
    };

    const handleContributionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCycleForContribution) return;

        const commonOptions = {
            preserveScroll: true,
            onSuccess: () => {
                setIsContributionModalOpen(false);
                toast.success(`Contribution ${contributionModalMode === 'add' ? 'added' : 'updated'} successfully!`);
                router.reload({ only: ['group'], preserveScroll: true, preserveState: true });
            },
            onError: (formErrors: Record<string, string | string[]>) => {
                console.error(`Error ${contributionModalMode === 'add' ? 'adding' : 'updating'} contribution:`, formErrors);
                toast.error(`Failed to ${contributionModalMode === 'add' ? 'add' : 'update'} contribution. Check form for errors.`);
            },
        };

        if (contributionModalMode === 'add') {
            postContribution(route('groups.cycles.contributions.store', { group: group.group_id, cycle: currentCycleForContribution.cycle_id }), {
                data: {
                    member_id: contributionData.member_id,
                    amount: contributionData.amount,
                    status: contributionData.status,
                    notes: contributionData.notes,
                },
                ...commonOptions,
            });
        } else if (editingContribution) {
            patchContribution(route('groups.cycles.contributions.update', { group: group.group_id, cycle: currentCycleForContribution.cycle_id, contribution: editingContribution.contribution_id }), {
                data: {
                    amount: contributionData.amount,
                    status: contributionData.status,
                    notes: contributionData.notes,
                },
                ...commonOptions,
            });
        }
    };

    const handleDeleteContribution = (contributionId: number, cycleId: number) => {
        if (confirm('Are you sure you want to delete this contribution?')) {
            router.delete(route('groups.cycles.contributions.destroy', { group: group.group_id, cycle: cycleId, contribution: contributionId }), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Contribution Deleted', { description: 'The contribution has been removed.' });
                    router.reload({ only: ['group'], preserveScroll: true, preserveState: true });
                },
                onError: (errorResponse) => {
                    console.error('Error deleting contribution:', errorResponse);
                    toast.error('Error Deleting Contribution', { description: 'Failed to remove the contribution.' });
                },
            });
        }
    };

    // Payout Modal State and Form
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [payoutModalMode, setPayoutModalMode] = useState<'add' | 'edit'>('add');
    const [editingPayout, setEditingPayout] = useState<EnrichedPayout | null>(null);
    const [currentCycleForPayout, setCurrentCycleForPayout] = useState<EnrichedCycle | null>(null);

    const { data: payoutData, setData: setPayoutData, post: postPayout, patch: patchPayout, errors: payoutErrors, reset: resetPayoutForm, processing: payoutProcessing, clearErrors: clearPayoutErrors } = useForm({
        member_id: '' as string | number, // This will be group_member_id
        amount: '' as string | number,
        status: 'scheduled' as 'scheduled' | 'completed' | 'failed',
    });

    useEffect(() => {
        if (!isPayoutModalOpen) {
            clearPayoutErrors();
            setEditingPayout(null);
            setCurrentCycleForPayout(null);
        }
    }, [isPayoutModalOpen, clearPayoutErrors]);

    const openAddPayoutModal = (cycle: EnrichedCycle) => {
        setPayoutModalMode('add');
        resetPayoutForm();
        setPayoutData('status', 'scheduled'); // Default status
        setCurrentCycleForPayout(cycle);
        setEditingPayout(null);
        setIsPayoutModalOpen(true);
    };

    const openEditPayoutModal = (payout: EnrichedPayout, cycle: EnrichedCycle) => {
        setPayoutModalMode('edit');
        setEditingPayout(payout);
        setCurrentCycleForPayout(cycle);
        setPayoutData({
            member_id: payout.member_id, // For display/reference, not for submission in edit
            amount: payout.amount.toString(),
            status: payout.status,
        });
        clearPayoutErrors();
        setIsPayoutModalOpen(true);
    };

    const handlePayoutSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCycleForPayout) return;

        const commonOptions = {
            preserveScroll: true,
            onSuccess: () => {
                setIsPayoutModalOpen(false);
                toast.success(`Payout ${payoutModalMode === 'add' ? 'added' : 'updated'} successfully!`);
                router.reload({ only: ['group'], preserveScroll: true, preserveState: true });
            },
            onError: (formErrors: Record<string, string | string[]>) => {
                console.error(`Error ${payoutModalMode === 'add' ? 'adding' : 'updating'} payout:`, formErrors);
                toast.error(`Failed to ${payoutModalMode === 'add' ? 'add' : 'update'} payout. Check form for errors.`);
            },
        };

        if (payoutModalMode === 'add') {
            postPayout(route('groups.cycles.payouts.store', { group: group.group_id, cycle: currentCycleForPayout.cycle_id }), {
                data: {
                    member_id: payoutData.member_id,
                    amount: payoutData.amount,
                    status: payoutData.status,
                },
                ...commonOptions,
            });
        } else if (editingPayout) {
            patchPayout(route('groups.cycles.payouts.update', { group: group.group_id, cycle: currentCycleForPayout.cycle_id, payout: editingPayout.payout_id }), {
                data: { // Do not send member_id for update unless it's editable
                    amount: payoutData.amount,
                    status: payoutData.status,
                },
                ...commonOptions,
            });
        }
    };

    const handleDeletePayout = (payoutId: number, cycleId: number) => {
        if (confirm('Are you sure you want to delete this payout?')) {
            router.delete(route('groups.cycles.payouts.destroy', { group: group.group_id, cycle: cycleId, payout: payoutId }), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Payout Deleted', { description: 'The payout has been removed.' });
                    router.reload({ only: ['group'], preserveScroll: true, preserveState: true });
                },
                onError: (errorResponse) => {
                    console.error('Error deleting payout:', errorResponse);
                    toast.error('Error Deleting Payout', { description: 'Failed to remove the payout.' });
                },
            });
        }
    };


    const memberColumns: ColumnDef<GroupMember>[] = useMemo(() => [
        {
            header: 'Position (Payout Date)',
            accessorKey: 'pivot.position',
            cell: ({ row }) => {
                const member = row.original;
                const memberPosition = member.pivot?.position;
                let payoutDateDisplay = 'N/A';
                if (memberPosition !== undefined && group.cycles) {
                    const relevantCycle = group.cycles.find(c => c.cycle_number === memberPosition);
                    if (relevantCycle?.start_date) {
                        payoutDateDisplay = new Date(relevantCycle.start_date).toLocaleString('default', { month: 'long', year: 'numeric' });
                    }
                }
                return payoutDateDisplay;
            },
        },
        { header: 'Name', accessorFn: (row) => `${row.client.first_name} ${row.client.last_name}`, cell: info => info.getValue() },
        { header: 'Email', accessorKey: 'client.email', cell: ({ row }) => row.original.client.email || 'N/A' },
        { header: 'Phone number', accessorKey: 'client.phone', cell: ({ row }) => row.original.client.phone || 'N/A' },
        { header: 'Joined At', accessorKey: 'pivot.joined_at', cell: ({ row }) => row.original.pivot?.joined_at ? new Date(row.original.pivot.joined_at).toLocaleDateString() : 'N/A' },
        {
            id: 'actions', header: 'Actions', cell: ({ row }) => (
                <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditMemberModal(row.original)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteMember(row.original.group_member_id)}>Delete</Button>
                </div>
            ),
        },
    ], [group.cycles, group.group_id, group.members]); // Removed openEditMemberModal, handleDeleteMember as they don't change

    const membersTable = useReactTable({
        data: group.members || [],
        columns: memberColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    // Payout columns are now defined within CycleTabContent using useMemo

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Group Details - ${group.name}`}/>
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Group Info Card */}
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

                {/* Members Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Members ({group.members?.length || 0})</CardTitle>
                        <Button onClick={openAddMemberModal} size="sm">Add Member</Button>
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
                                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={memberColumns.length} className="h-24 text-center">No members.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (<p>No members in this group.</p>)}
                    </CardContent>
                </Card>

                {/* Member Add/Edit Dialog */}
                <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{memberModalMode === 'add' ? 'Add New Member' : 'Edit Member'}</DialogTitle>
                            <DialogDescription>{memberModalMode === 'add' ? "Select a client and assign a position." : "Update the member's position."}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleMemberSubmit}>
                            <div className="grid gap-4 py-4">
                                {memberModalMode === 'add' && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="client_id" className="text-right">Client</Label>
                                        <div className="col-span-3">
                                            <Select value={memberData.client_id} onValueChange={(value) => setMemberData('client_id', value)}>
                                                <SelectTrigger id="client_id"><SelectValue placeholder="Select a client" /></SelectTrigger>
                                                <SelectContent>
                                                    {allClients.map(client => (
                                                        <SelectItem key={client.client_id} value={client.client_id.toString()}>
                                                            {client.first_name} {client.last_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {memberErrors.client_id && <p className="mt-1 text-xs text-red-500">{memberErrors.client_id}</p>}
                                        </div>
                                    </div>
                                )}
                                {memberModalMode === 'edit' && editingMemberId && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Client</Label>
                                        <p className="col-span-3">
                                            {group.members.find(m => m.group_member_id === editingMemberId)?.client.first_name}{' '}
                                            {group.members.find(m => m.group_member_id === editingMemberId)?.client.last_name}
                                        </p>
                                    </div>
                                )}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="position" className="text-right">Position</Label>
                                    <div className="col-span-3">
                                        <Input id="position" type="number" value={memberData.position} onChange={(e) => setMemberData('position', e.target.value)} />
                                        {memberErrors.position && <p className="mt-1 text-xs text-red-500">{memberErrors.position}</p>}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={memberProcessing}>{memberProcessing ? 'Saving...' : (memberModalMode === 'add' ? 'Add Member' : 'Save Changes')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Cycles Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Cycles ({group.cycles?.length || 0})</CardTitle>
                        <Button onClick={openAddCycleModal} size="sm">Add Cycle</Button>
                    </CardHeader>
                    <CardContent>
                        {group.cycles && group.cycles.length > 0 ? (
                            <Tabs defaultValue={`cycle-${group.cycles[0].cycle_id}`} className="w-full">
                                <TabsList className="grid w-full grid-cols-none justify-start overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                                    {group.cycles.map(cycle => (
                                        <TabsTrigger key={cycle.cycle_id} value={`cycle-${cycle.cycle_id}`} className="whitespace-nowrap">
                                            Cycle {cycle.cycle_number}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {group.cycles.map(cycle => (
                                    <CycleTabContent
                                        key={cycle.cycle_id}
                                        cycle={cycle}
                                        // payoutColumns={payoutColumns} // Removed
                                        onEditCycle={openEditCycleModal}
                                        onDeleteCycle={handleDeleteCycle}
                                        groupMembers={group.members}
                                        onAddContribution={openAddContributionModal}
                                        onEditContribution={openEditContributionModal}
                                        onDeleteContribution={handleDeleteContribution}
                                        onAddPayout={openAddPayoutModal}         // Pass handler
                                        onEditPayout={openEditPayoutModal}       // Pass handler
                                        onDeletePayout={handleDeletePayout}     // Pass handler
                                        groupId={group.group_id}
                                    />
                                ))}
                            </Tabs>
                        ) : (
                            <p>No cycles found for this group. Click "Add Cycle" to create one.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Cycle Add/Edit Dialog */}
                <Dialog open={isCycleModalOpen} onOpenChange={setIsCycleModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{cycleModalMode === 'add' ? 'Add New Cycle' : `Edit Cycle ${editingCycle?.cycle_number || ''}`}</DialogTitle>
                            <DialogDescription>
                                {cycleModalMode === 'add' ? "Define the details for the new cycle." : "Update the cycle details."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCycleSubmit}>
                            <div className="grid gap-4 py-4">
                                {cycleModalMode === 'add' && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="cycle_number" className="text-right">Cycle Number</Label>
                                        <div className="col-span-3">
                                            <Input id="cycle_number" type="number" value={cycleData.cycle_number} onChange={(e) => setCycleData('cycle_number', e.target.value)} />
                                            {cycleErrors.cycle_number && <p className="mt-1 text-xs text-red-500">{cycleErrors.cycle_number}</p>}
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="start_date" className="text-right">Start Date</Label>
                                    <div className="col-span-3">
                                        <Input id="start_date" type="date" value={cycleData.start_date} onChange={(e) => setCycleData('start_date', e.target.value)} />
                                        {cycleErrors.start_date && <p className="mt-1 text-xs text-red-500">{cycleErrors.start_date}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="end_date" className="text-right">End Date</Label>
                                    <div className="col-span-3">
                                        <Input id="end_date" type="date" value={cycleData.end_date} onChange={(e) => setCycleData('end_date', e.target.value)} />
                                        {cycleErrors.end_date && <p className="mt-1 text-xs text-red-500">{cycleErrors.end_date}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="status" className="text-right">Status</Label>
                                    <div className="col-span-3">
                                        <Select value={cycleData.status} onValueChange={(value) => setCycleData('status', value)}>
                                            <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {cycleErrors.status && <p className="mt-1 text-xs text-red-500">{cycleErrors.status}</p>}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={cycleProcessing}>
                                    {cycleProcessing ? 'Saving...' : (cycleModalMode === 'add' ? 'Add Cycle' : 'Save Changes')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Contribution Add/Edit Dialog */}
                <Dialog open={isContributionModalOpen} onOpenChange={setIsContributionModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{contributionModalMode === 'add' ? 'Add New Contribution' : `Edit Contribution`}</DialogTitle>
                            <DialogDescription>
                                {contributionModalMode === 'add'
                                    ? `Adding contribution to Cycle ${currentCycleForContribution?.cycle_number || ''}.`
                                    : `Editing contribution for ${editingContribution?.member_name || ''} in Cycle ${currentCycleForContribution?.cycle_number || ''}.`}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleContributionSubmit}>
                            <div className="grid gap-4 py-4">
                                {contributionModalMode === 'add' && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="member_id" className="text-right">Member</Label>
                                        <div className="col-span-3">
                                            <Select
                                                value={contributionData.member_id.toString()}
                                                onValueChange={(value) => setContributionData('member_id', value)}
                                            >
                                                <SelectTrigger id="member_id"><SelectValue placeholder="Select a member" /></SelectTrigger>
                                                <SelectContent>
                                                    {group.members.map(member => (
                                                        <SelectItem key={member.group_member_id} value={member.group_member_id.toString()}>
                                                            {member.client.first_name} {member.client.last_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {contributionErrors.member_id && <p className="mt-1 text-xs text-red-500">{contributionErrors.member_id}</p>}
                                        </div>
                                    </div>
                                )}
                                {contributionModalMode === 'edit' && editingContribution && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Member</Label>
                                        <p className="col-span-3">{editingContribution.member_name}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="amount" className="text-right">Amount</Label>
                                    <div className="col-span-3">
                                        <Input id="amount" type="number" value={contributionData.amount} onChange={(e) => setContributionData('amount', e.target.value)} />
                                        {contributionErrors.amount && <p className="mt-1 text-xs text-red-500">{contributionErrors.amount}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="contribution_status" className="text-right">Status</Label>
                                    <div className="col-span-3">
                                        <Select value={contributionData.status} onValueChange={(value) => setContributionData('status', value as 'pending' | 'paid' | 'missed')}>
                                            <SelectTrigger id="contribution_status"><SelectValue placeholder="Select status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="missed">Missed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {contributionErrors.status && <p className="mt-1 text-xs text-red-500">{contributionErrors.status}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="notes" className="text-right">Notes</Label>
                                    <div className="col-span-3">
                                        <Textarea id="notes" value={contributionData.notes} onChange={(e) => setContributionData('notes', e.target.value)} placeholder="Optional notes..." />
                                        {contributionErrors.notes && <p className="mt-1 text-xs text-red-500">{contributionErrors.notes}</p>}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={contributionProcessing}>
                                    {contributionProcessing ? 'Saving...' : (contributionModalMode === 'add' ? 'Add Contribution' : 'Save Changes')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Payout Add/Edit Dialog */}
                <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{payoutModalMode === 'add' ? 'Add New Payout' : `Edit Payout`}</DialogTitle>
                            <DialogDescription>
                                {payoutModalMode === 'add'
                                    ? `Adding payout to Cycle ${currentCycleForPayout?.cycle_number || ''}.`
                                    : `Editing payout for ${editingPayout?.member_name || ''} in Cycle ${currentCycleForPayout?.cycle_number || ''}.`}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePayoutSubmit}>
                            <div className="grid gap-4 py-4">
                                {payoutModalMode === 'add' && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="payout_member_id" className="text-right">Member</Label>
                                        <div className="col-span-3">
                                            <Select
                                                value={payoutData.member_id.toString()}
                                                onValueChange={(value) => setPayoutData('member_id', value)}
                                            >
                                                <SelectTrigger id="payout_member_id"><SelectValue placeholder="Select a member" /></SelectTrigger>
                                                <SelectContent>
                                                    {group.members.map(member => (
                                                        <SelectItem key={member.group_member_id} value={member.group_member_id.toString()}>
                                                            {member.client.first_name} {member.client.last_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {payoutErrors.member_id && <p className="mt-1 text-xs text-red-500">{payoutErrors.member_id}</p>}
                                        </div>
                                    </div>
                                )}
                                {payoutModalMode === 'edit' && editingPayout && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Member</Label>
                                        <p className="col-span-3">{editingPayout.member_name}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="payout_amount" className="text-right">Amount</Label>
                                    <div className="col-span-3">
                                        <Input id="payout_amount" type="number" value={payoutData.amount} onChange={(e) => setPayoutData('amount', e.target.value)} />
                                        {payoutErrors.amount && <p className="mt-1 text-xs text-red-500">{payoutErrors.amount}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="payout_status" className="text-right">Status</Label>
                                    <div className="col-span-3">
                                        <Select value={payoutData.status} onValueChange={(value) => setPayoutData('status', value as 'scheduled' | 'completed' | 'failed')}>
                                            <SelectTrigger id="payout_status"><SelectValue placeholder="Select status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="failed">Failed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {payoutErrors.status && <p className="mt-1 text-xs text-red-500">{payoutErrors.status}</p>}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={payoutProcessing}>
                                    {payoutProcessing ? 'Saving...' : (payoutModalMode === 'add' ? 'Add Payout' : 'Save Changes')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </AppLayout>
    );
}
