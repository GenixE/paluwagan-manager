import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href?: string;
    isActive?: boolean;
    isCurrent?: boolean;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Client {
    client_id: number;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
}

export interface Group {
    group_id: number;
    name: string;
    description?: string | null;
    current_cycle: number;
    status: 'active' | 'finished' | 'pending'; // Added pending as a common status
    created_at: string;
    status_changed_at: string;
    members_count: number;
}

export interface Cycle {
    cycle_id: number;
    cycle_number: number;
    start_date: string; // Added
    end_date: string;   // Added (renamed from due_date conceptually)
    status: 'pending' | 'active' | 'completed' | 'cancelled'; // Example statuses
    contribution_amount?: number | null; // Example field
    group?: Group; // Optional if not always loaded or needed at this level
    // Removed payout_date as it's not on the cycle model directly anymore
}

export interface Payout {
    payout_id: number;
    member_id: number;
    cycle_id: number;
    amount: number;
    status: 'scheduled' | 'completed' | 'failed';
    paid_at?: string | null; // This is the actual date of payment
    created_at: string;
    updated_at: string;
    member: {
        member_id: number;
        client: Client;
    };
    cycle: Pick<Cycle, 'cycle_id' | 'cycle_number'>; // Link to cycle, but avoid full cycle object if not needed
    // The 'payout_date' that was previously on EnrichedPayout will come from 'paid_at'
}

export interface Contribution {
    contribution_id: number;
    member_id: number;
    cycle_id: number;
    amount: number;
    status: 'pending' | 'paid' | 'missed';
    paid_at?: string | null; // This is the actual date of payment
    created_at: string;
    updated_at: string;
    member: {
        member_id: number;
        client: Client;
    };
    cycle: Pick<Cycle, 'cycle_id' | 'cycle_number'>; // Link to cycle
    // The 'contribution_date' that was previously on EnrichedContribution will come from 'paid_at'
}
