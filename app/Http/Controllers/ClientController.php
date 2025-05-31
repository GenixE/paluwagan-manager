<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Inertia\Inertia; // Import Inertia
use Inertia\Response as InertiaResponse; // Import Inertia Response for type hinting
use Symfony\Component\HttpFoundation\Response;

class ClientController extends Controller
{
    public function index(): InertiaResponse
    {
        return Inertia::render('client', [
            'clients' => Client::all()->map(fn ($client) => [
                'client_id' => $client->client_id, // Ensure your model uses client_id or adjust accordingly
                'first_name' => $client->first_name,
                'last_name' => $client->last_name,
                'email' => $client->email,
                'phone' => $client->phone,
                'address' => $client->address,
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => 'nullable|email|unique:clients,email',
            'phone'      => 'nullable|string|max:50',
            'address'    => 'nullable|string',
        ]);

        $client = Client::create($data);
        return response()->json($client, Response::HTTP_CREATED);
    }

    public function show($id)
    {
        // Assuming $id refers to client_id or your model's route key name is configured
        return response()->json(Client::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $client = Client::findOrFail($id); // Assuming $id refers to client_id
        $data = $request->validate([
            'first_name' => 'sometimes|required|string|max:100',
            'last_name'  => 'sometimes|required|string|max:100',
            // Ensure the unique rule correctly references your primary key column if it's not 'id'
            'email'      => "sometimes|email|unique:clients,email,{$client->getKey()},{$client->getKeyName()}",
            'phone'      => 'nullable|string|max:50',
            'address'    => 'nullable|string',
        ]);
        $client->update($data);
        return response()->json($client);
    }

    public function destroy($id)
    {
        $client = Client::findOrFail($id); // Assuming $id refers to client_id
        $client->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
