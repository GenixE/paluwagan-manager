import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Group } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel,
} from '@tanstack/react-table';
import React, { FormEventHandler, useEffect } from 'react';
import { ArrowUpDown, MoreHorizontal, PlusCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface GroupPageProps {
    groups: Group[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Groups',
        href: route('groups.index'),
        isCurrent: true,
    },
];

export default function GroupPage({ groups }: GroupPageProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');

    const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
    const {
        data: createData,
        setData: setCreateData,
        post: createPost,
        processing: createProcessing,
        errors: createErrors,
        reset: resetCreateForm,
        wasSuccessful: createWasSuccessful,
    } = useForm({
        name: '',
        description: '',
        status: 'active', // Added status with default
    });

    const [isEditDialogOpen, setEditDialogOpen] = React.useState(false);
    const [editingGroupId, setEditingGroupId] = React.useState<number | null>(null);
    const {
        data: editData,
        setData: setEditData,
        put: editPut,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEditForm,
        wasSuccessful: editWasSuccessful,
    } = useForm({
        name: '',
        description: '',
        status: 'active', // Added status
    });

    const handleCreateSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        createPost(route('groups.store'), {
            onSuccess: () => {
                toast.success('Group Created Successfully', {
                    description: `Group ${createData.name} has been added.`,
                });
                setCreateDialogOpen(false);
            },
            onError: (errors) => {
                console.error("Create group errors:", errors);
                toast.error('Error Creating Group', {
                    description: 'Please check the form for errors and try again.',
                });
            }
        });
    };

    useEffect(() => {
        if (createWasSuccessful && !isCreateDialogOpen) {
            resetCreateForm();
        }
    }, [createWasSuccessful, isCreateDialogOpen, resetCreateForm]);

    const openEditDialog = (group: Group) => {
        setEditingGroupId(group.group_id);
        resetEditForm(); // Reset before setting new data to clear previous errors
        setEditData({
            name: group.name || '',
            description: group.description || '',
            status: group.status || 'active', // Set status from group data
        });
        setEditDialogOpen(true);
    };

    const handleEditSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        if (!editingGroupId) return;
        editPut(route('groups.update', editingGroupId), {
            onSuccess: () => {
                toast.success('Group Updated Successfully', {
                    description: `Group ${editData.name} has been updated.`,
                });
                setEditDialogOpen(false);
            },
            onError: (errors) => {
                console.error("Update group errors:", errors);
                toast.error('Error Updating Group', {
                    description: 'Please check the form for errors and try again.',
                });
            }
        });
    };

    useEffect(() => {
        if (editWasSuccessful && !isEditDialogOpen) {
            resetEditForm();
            setEditingGroupId(null);
        }
    }, [editWasSuccessful, isEditDialogOpen, resetEditForm]);

    const columns: ColumnDef<Group>[] = [
        {
            accessorKey: 'group_id',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    ID <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div className="lowercase">{row.getValue('group_id')}</div>,
        },
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => <div className="truncate max-w-xs">{row.getValue('description') || 'N/A'}</div>,
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Status <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div className="capitalize">{row.getValue('status')}</div>,
        },
        {
            accessorKey: 'members_count',
            header: 'Members',
            cell: ({ row }) => {
                const count = row.getValue('members_count') as number;
                return <div>{`${count}/16`}</div>;
            },
        },
        {
            accessorKey: 'created_at',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Created At <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.getValue('created_at')}</div>,
        },
        {
            accessorKey: 'status_changed_at',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Updated At <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div>{row.getValue('status_changed_at') || 'N/A'}</div>,
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const group = row.original;

                const handleDeleteConfirm = () => {
                    router.delete(route('groups.destroy', group.group_id), {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast.success('Group Deleted', { description: `Group ${group.name} has been deleted.` });
                        },
                        onError: (errors: Record<string, string | string[]>) => {
                            console.error("Deletion errors:", errors);
                            let message = 'An unexpected error occurred.';
                            if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
                                message = Object.values(errors).flat().join(' ') || 'Please check console for details.';
                            } else if (typeof errors === 'string') {
                                message = errors;
                            }
                            toast.error('Error Deleting Group', { description: message });
                        }
                    });
                };

                return (
                    <div className="text-right font-medium">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(group.group_id.toString())}>
                                    Copy group ID
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.get(route('groups.show', group.group_id))}>
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditDialog(group)}>
                                    Edit group
                                </DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                            className="text-red-600 hover:!text-red-700 focus:!text-red-700 focus:!bg-red-100 dark:focus:!bg-red-700/20"
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            Delete group
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the
                                                group <span className="font-semibold">{group.name}</span> and all associated data.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDeleteConfirm}
                                                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                                            >
                                                Continue
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data: groups,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 15,
            },
        },
    });

    const handleRowClick = (group: Group) => {
        router.get(route('groups.show', group.group_id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Groups" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold md:text-2xl">Groups List</h1>
                    <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                        setCreateDialogOpen(open);
                        if (!open) resetCreateForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 size-4" />
                                Add Group
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New Group</DialogTitle>
                                <DialogDescription>
                                    Fill in the information for the new group. Click save when you're done.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="create_group_name">Group Name</Label>
                                    <Input id="create_group_name" value={createData.name} onChange={(e) => setCreateData('name', e.target.value)} required />
                                    {createErrors.name && <p className="mt-1 text-sm text-red-500">{createErrors.name}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="create_group_description">Description</Label>
                                    <Textarea id="create_group_description" value={createData.description} onChange={(e) => setCreateData('description', e.target.value)} placeholder="Optional: Describe the group's purpose" className="min-h-[100px]" />
                                    {createErrors.description && <p className="mt-1 text-sm text-red-500">{createErrors.description}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="create_group_status">Status</Label>
                                    <Select value={createData.status} onValueChange={(value) => setCreateData('status', value)}>
                                        <SelectTrigger id="create_group_status">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="finished">Finished</SelectItem>
                                            {/* Add other statuses if needed, e.g., pending */}
                                            {/* <SelectItem value="pending">Pending</SelectItem> */}
                                        </SelectContent>
                                    </Select>
                                    {createErrors.status && <p className="mt-1 text-sm text-red-500">{createErrors.status}</p>}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={createProcessing}>
                                        {createProcessing ? 'Creating...' : 'Create Group'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                    setEditDialogOpen(open);
                    if (!open) {
                        resetEditForm();
                        setEditingGroupId(null);
                    }
                }}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Group</DialogTitle>
                            <DialogDescription>
                                Update the group's information. Click save when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit_group_name">Group Name</Label>
                                <Input id="edit_group_name" value={editData.name} onChange={(e) => setEditData('name', e.target.value)} required />
                                {editErrors.name && <p className="mt-1 text-sm text-red-500">{editErrors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_group_description">Description</Label>
                                <Textarea id="edit_group_description" value={editData.description} onChange={(e) => setEditData('description', e.target.value)} placeholder="Optional: Describe the group's purpose" className="min-h-[100px]" />
                                {editErrors.description && <p className="mt-1 text-sm text-red-500">{editErrors.description}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_group_status">Status</Label>
                                <Select value={editData.status} onValueChange={(value) => setEditData('status', value)}>
                                    <SelectTrigger id="edit_group_status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="finished">Finished</SelectItem>
                                        {/* Add other statuses if needed, e.g., pending */}
                                        {/* <SelectItem value="pending">Pending</SelectItem> */}
                                    </SelectContent>
                                </Select>
                                {editErrors.status && <p className="mt-1 text-sm text-red-500">{editErrors.status}</p>}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={editProcessing}>
                                    {editProcessing ? 'Updating...' : 'Update Group'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <div className="flex items-center py-4">
                    <Input
                        placeholder="Filter by name or description..."
                        value={globalFilter ?? ''}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="max-w-sm"
                    />
                </div>

                {groups.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
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
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && 'selected'}
                                            onClick={() => handleRowClick(row.original)}
                                            className="cursor-pointer"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} onClick={(e) => {
                                                    if ((e.target as HTMLElement).closest('[role="menuitem"], [role="menu"], [data-radix-dropdown-menu-trigger], [role="dialog"], [role="alertdialog"]')) {
                                                        e.stopPropagation();
                                                    }
                                                }}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex min-h-[200px] flex-1 items-center justify-center rounded-xl border p-4">
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No groups found</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Get started by creating a new group.
                            </p>
                        </div>
                    </div>
                )}
                {groups.length > 0 && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page{' '}
                            {table.getState().pagination.pageIndex + 1} of{' '}
                            {table.getPageCount()}
                        </span>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
