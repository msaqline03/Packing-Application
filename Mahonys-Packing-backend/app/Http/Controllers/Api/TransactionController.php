<?php

namespace App\Http\Controllers\Api;

use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with(['commodity', 'location']);
        if ($request->filled('account_id')) {
            $query->where('account_id', $request->account_id);
        }
        if ($request->filled('ticket_id')) {
            $query->where('ticket_id', $request->ticket_id);
        }
        if ($request->filled('ticket_type')) {
            $query->where('ticket_type', $request->ticket_type);
        }
        if ($request->filled('from_date')) {
            $query->where('transaction_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->where('transaction_date', '<=', $request->to_date);
        }
        return $this->success($query->orderBy('transaction_date')->orderBy('id')->get());
    }

    public function byTicket(string $ticketId): JsonResponse
    {
        $items = Transaction::where('ticket_id', $ticketId)->with(['commodity', 'location'])->orderBy('transaction_date')->orderBy('id')->get();
        return $this->success($items);
    }

    public function byAccount(string $accountId): JsonResponse
    {
        $items = Transaction::where('account_id', $accountId)->with(['commodity', 'location'])->orderBy('transaction_date')->orderBy('id')->get();
        return $this->success($items);
    }
}
