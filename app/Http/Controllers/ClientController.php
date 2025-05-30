<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ClientController extends Controller
{
    public function index()
    {
        return response()->json(Client::all());
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
        return response()->json(Client::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $client = Client::findOrFail($id);
        $data = $request->validate([
            'first_name' => 'sometimes|required|string|max:100',
            'last_name'  => 'sometimes|required|string|max:100',
            'email'      => "sometimes|email|unique:clients,email,{$id},client_id",
            'phone'      => 'nullable|string|max:50',
            'address'    => 'nullable|string',
        ]);
        $client->update($data);
        return response()->json($client);
    }

    public function destroy($id)
    {
        $client = Client::findOrFail($id);
        $client->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
