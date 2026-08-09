<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class TestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
        ]);

        DB::table('test')->insert([
            'name' => $request->name,
            'email' => $request->email,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Data saved successfully']);
    }
}
