import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Client } from '@/types';
import { Head, router, useForm } from '@inertiajs/react'; // Removed Link
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface ClientPageProps {
    clients: Client[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Clients',
        href: route('clients.index'),
        isCurrent: true,
    },
];

export default function ClientPage({ clients }: ClientPageProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');

    // State for Create Client Dialog
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
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
    });

    // State for Edit Client Dialog
    const [isEditDialogOpen, setEditDialogOpen] = React.useState(false);
    const [editingClientId, setEditingClientId] = React.useState<number | null>(null);
    const {
        data: editData,
        setData: setEditData,
        put: editPut,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEditForm,
        wasSuccessful: editWasSuccessful,
    } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
    });

    const handleCreateSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        createPost(route('clients.store'), {
            onSuccess: () => {
                toast.success('Client Created Successfully', {
                    description: `Client ${createData.first_name} ${createData.last_name} has been added.`,
                });
                setCreateDialogOpen(false);
                // Form is reset via onOpenChange or useEffect
            },
            onError: () => {
                toast.error('Error Creating Client', {
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


    const openEditDialog = (client: Client) => {
        setEditingClientId(client.client_id);
        // First, reset the form to its initial (empty) state to clear any previous data and errors
        resetEditForm();
        // Then, set the data for the client being edited
        setEditData({
            first_name: client.first_name || '',
            last_name: client.last_name || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
        });
        setEditDialogOpen(true);
    };

    const handleEditSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        if (!editingClientId) return;
        editPut(route('clients.update', editingClientId), {
            onSuccess: () => {
                toast.success('Client Updated Successfully', {
                    description: `Client ${editData.first_name} ${editData.last_name} has been updated.`,
                });
                setEditDialogOpen(false);
                // Form is reset via onOpenChange or useEffect
            },
            onError: () => {
                toast.error('Error Updating Client', {
                    description: 'Please check the form for errors and try again.',
                });
            }
        });
    };

    useEffect(() => {
        if (editWasSuccessful && !isEditDialogOpen) {
            resetEditForm();
            setEditingClientId(null);
        }
    }, [editWasSuccessful, isEditDialogOpen, resetEditForm]);


    const columns: ColumnDef<Client>[] = [
        {
            accessorKey: 'client_id',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    ID <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div className="lowercase">{row.getValue('client_id')}</div>,
        },
        {
            accessorFn: row => `${row.first_name} ${row.last_name}`,
            id: 'name',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Name <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div className="font-medium">{row.original.first_name} {row.original.last_name}</div>,
        },
        { accessorKey: 'email', header: 'Email', cell: ({ row }) => <div>{row.getValue('email') || 'N/A'}</div> },
        { accessorKey: 'phone', header: 'Phone', cell: ({ row }) => <div>{row.getValue('phone') || 'N/A'}</div> },
        { accessorKey: 'address', header: 'Address', cell: ({ row }) => <div>{row.getValue('address') || 'N/A'}</div> },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const client = row.original;
                const handleDeleteConfirm = () => {
                    router.delete(route('clients.destroy', client.client_id), {
                        preserveScroll: true,
                        onSuccess: () => toast.success('Client Deleted', { description: `Client ${client.first_name} ${client.last_name} has been deleted.` }),
                        onError: () => toast.error('Error Deleting Client', { description: 'An unexpected error occurred.' })
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
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(client.client_id.toString())}>
                                    Copy client ID
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditDialog(client)}>
                                    Edit client
                                </DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                            className="text-red-600 hover:!text-red-700 focus:!text-red-700 focus:!bg-red-100 dark:focus:!bg-red-700/20"
                                            onSelect={(e) => e.preventDefault()} // Prevent dropdown from closing
                                        >
                                            Delete client
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the
                                                client <span className="font-semibold">{client.first_name} {client.last_name}</span> and all associated data.
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
        }
    ];

    const table = useReactTable({
        data: clients,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),
        state: { sorting, globalFilter },
        initialState: { pagination: { pageSize: 10 } },
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold md:text-2xl">Clients List</h1>
                    <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                        setCreateDialogOpen(open);
                        if (!open) resetCreateForm(); // Reset form when dialog closes
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 size-4" />
                                Add Client
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Client</DialogTitle>
                                <DialogDescription>
                                    Fill in the information for the new client. Click save when you're done.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="create_first_name">First Name</Label>
                                    <Input id="create_first_name" value={createData.first_name} onChange={(e) => setCreateData('first_name', e.target.value)} required />
                                    {createErrors.first_name && <p className="mt-1 text-sm text-red-500">{createErrors.first_name}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="create_last_name">Last Name</Label>
                                    <Input id="create_last_name" value={createData.last_name} onChange={(e) => setCreateData('last_name', e.target.value)} required />
                                    {createErrors.last_name && <p className="mt-1 text-sm text-red-500">{createErrors.last_name}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="create_email">Email</Label>
                                    <Input id="create_email" type="email" value={createData.email} onChange={(e) => setCreateData('email', e.target.value)} />
                                    {createErrors.email && <p className="mt-1 text-sm text-red-500">{createErrors.email}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="create_phone">Phone</Label>
                                    <Input id="create_phone" value={createData.phone} onChange={(e) => setCreateData('phone', e.target.value)} />
                                    {createErrors.phone && <p className="mt-1 text-sm text-red-500">{createErrors.phone}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="create_address">Address</Label>
                                    <Input id="create_address" value={createData.address} onChange={(e) => setCreateData('address', e.target.value)} />
                                    {createErrors.address && <p className="mt-1 text-sm text-red-500">{createErrors.address}</p>}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={createProcessing}>
                                        {createProcessing ? 'Creating...' : 'Create Client'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Edit Client Dialog (Rendered but controlled by isEditDialogOpen) */}
                <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                    setEditDialogOpen(open);
                    if (!open) {
                        resetEditForm();
                        setEditingClientId(null);
                    }
                }}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit Client</DialogTitle>
                            <DialogDescription>
                                Update the client's information. Click save when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit_first_name">First Name</Label>
                                <Input id="edit_first_name" value={editData.first_name} onChange={(e) => setEditData('first_name', e.target.value)} required />
                                {editErrors.first_name && <p className="mt-1 text-sm text-red-500">{editErrors.first_name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_last_name">Last Name</Label>
                                <Input id="edit_last_name" value={editData.last_name} onChange={(e) => setEditData('last_name', e.target.value)} required />
                                {editErrors.last_name && <p className="mt-1 text-sm text-red-500">{editErrors.last_name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_email">Email</Label>
                                <Input id="edit_email" type="email" value={editData.email} onChange={(e) => setEditData('email', e.target.value)} />
                                {editErrors.email && <p className="mt-1 text-sm text-red-500">{editErrors.email}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_phone">Phone</Label>
                                <Input id="edit_phone" value={editData.phone} onChange={(e) => setEditData('phone', e.target.value)} />
                                {editErrors.phone && <p className="mt-1 text-sm text-red-500">{editErrors.phone}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_address">Address</Label>
                                <Input id="edit_address" value={editData.address} onChange={(e) => setEditData('address', e.target.value)} />
                                {editErrors.address && <p className="mt-1 text-sm text-red-500">{editErrors.address}</p>}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={editProcessing}>
                                    {editProcessing ? 'Updating...' : 'Update Client'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>


                <div className="flex items-center py-4">
                    <Input
                        placeholder="Filter by name, email..."
                        value={globalFilter ?? ''}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="max-w-sm"
                    />
                </div>

                {clients.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border">
                        <Table>
                            <TableHeader>{table.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? table.getRowModel().rows.map(row => (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                        {row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="relative flex min-h-[200px] flex-1 items-center justify-center rounded-xl border p-4">
                        <div className="text-center">
                            <h3 className="text-lg font-medium">No clients found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Get started by creating a new client.</p>
                            {/* The Add Client button is now at the top of the page */}
                        </div>
                    </div>
                )}
                {clients.length > 0 && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
                        <span className="text-sm text-muted-foreground">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
