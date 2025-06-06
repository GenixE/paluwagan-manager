<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Inertia\Inertia; // Import Inertia
use Inertia\Response as InertiaResponse; // Import Inertia Response for type hinting
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Http\RedirectResponse; // Import RedirectResponse

class ClientController extends Controller
{
    public function index(): InertiaResponse
    {
        return Inertia::render('client', [
            'clients' => Client::all()->map(fn ($client) => [
                'client_id' => $client->client_id,
                'first_name' => $client->first_name,
                'last_name' => $client->last_name,
                'email' => $client->email,
                'phone' => $client->phone,
                'address' => $client->address,
            ]),
        ]);
    }

    public function create(): InertiaResponse
    {
        return Inertia::render('client/create-client');
    }

    public function store(Request $request): RedirectResponse // Changed return type
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => 'nullable|email|unique:clients,email',
            'phone'      => 'nullable|string|max:50',
            'address'    => 'nullable|string',
        ]);

        Client::create($data);
        return redirect()->route('clients.index')->with('success', 'Client created successfully.');
    }

    public function show($id) // Or Client $client with route model binding
    {
        $client = Client::findOrFail($id);
        // This would typically render a client detail page.
        // For now, let's assume it could be used for an edit form or a dedicated show page.
        // If you have a Client/ShowClient.tsx view:
        // return Inertia::render('Client/ShowClient', ['client' => $client]);
        // For an API-like response, you might return JSON:
        return response()->json($client);
    }

    public function edit($id): InertiaResponse // Or Client $client with route model binding
    {
        $client = Client::findOrFail($id);
        return Inertia::render('client/edit-client', [
            'client' => [ // Ensure all fields expected by the form are here
                'client_id' => $client->client_id,
                'first_name' => $client->first_name,
                'last_name' => $client->last_name,
                'email' => $client->email,
                'phone' => $client->phone,
                'address' => $client->address,
            ],
        ]);
    }

    public function update(Request $request, $id): RedirectResponse // Or Client $client with route model binding. Changed return type
    {
        $client = Client::findOrFail($id);
        $data = $request->validate([
            'first_name' => 'sometimes|required|string|max:100',
            'last_name'  => 'sometimes|required|string|max:100',
            'email'      => "sometimes|nullable|email|unique:clients,email,{$client->getKey()},{$client->getKeyName()}",
            'phone'      => 'nullable|string|max:50',
            'address'    => 'nullable|string',
        ]);
        $client->update($data);
        return redirect()->route('clients.index')->with('success', 'Client updated successfully.');
    }

    public function destroy($id): RedirectResponse // Or Client $client with route model binding. Changed return type
    {
        $client = Client::findOrFail($id);
        $client->delete();
        return redirect()->route('clients.index')->with('success', 'Client deleted successfully.');
    }
}
